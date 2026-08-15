import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Empties the store for launch, keeping staff logins and site configuration.
 *
 * This is destructive and there is no undo inside the application. Both Vercel
 * deployments read one DATABASE_URL, so this runs against real production data
 * — take a Supabase snapshot first. It is separate from prisma/seed.ts because
 * seed.ts recreates accounts from SEED_* env vars, which is the wrong thing to
 * do to a database whose staff accounts were created through /admin.
 *
 * What survives:
 *   - every User whose role is not CUSTOMER (matched on role, not on a
 *     hardcoded email, so staff added later survive too) — unless --all-users
 *     is passed, which deletes staff as well for a clean client handover
 *   - the SiteSettings singleton
 *
 * Everything else goes, including the catalogue.
 *
 * Cloudinary assets are NOT touched. The rows referencing them are deleted, so
 * the images become unreferenced but stay in the Cloudinary account.
 */

// See src/lib/db.ts — DATABASE_SSL=false is the local-Postgres escape hatch.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter });

/**
 * Both spellings are accepted because the two shells in use here disagree:
 * `CONFIRM_RESET=YES npm run db:reset` is bash-only, and PowerShell has no
 * inline env-var prefix. `npm run db:reset -- --confirm` works in both.
 */
const confirmed =
  process.env.CONFIRM_RESET === "YES" || process.argv.includes("--confirm");

/**
 * Deletes staff accounts too, not just customers.
 *
 * For a handover this is the point: the accounts on the database were created
 * during development, by us, with passwords we have seen. Wiping them and
 * re-provisioning through `npm run db:staff` is what makes the client's
 * credentials theirs alone.
 *
 * It is also the one flag that can lock everybody out of /admin, so it disables
 * the staff guard below and the run is only complete once db:staff has been run
 * against the same database.
 */
const wipeAllUsers = process.argv.includes("--all-users");

/**
 * Product categories are a RoomCategory enum column on Product, not a table, so
 * they disappear with the products — there is nothing separate to clear. The
 * category *selection* in SiteSettings (shopSections) survives with the rest of
 * the settings; the client edits it at /admin/settings.
 */

/** Counted before and after, so the terminal output is the audit trail. */
async function snapshot() {
  const [
    users,
    staff,
    products,
    variants,
    combos,
    orders,
    carts,
    addresses,
    testimonials,
    customRequests,
    auditLogs,
    consentRecords,
    privacyRequests,
    errorEvents,
    securityEvents,
    siteSettings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: { not: "CUSTOMER" } } }),
    prisma.product.count(),
    prisma.variant.count(),
    prisma.combo.count(),
    prisma.order.count(),
    prisma.cart.count(),
    prisma.address.count(),
    prisma.testimonial.count(),
    prisma.customFurnitureRequest.count(),
    prisma.auditLog.count(),
    prisma.consentRecord.count(),
    prisma.privacyRequest.count(),
    prisma.errorEvent.count(),
    prisma.securityEvent.count(),
    prisma.siteSettings.count(),
  ]);

  return {
    users,
    staff,
    customers: users - staff,
    products,
    variants,
    combos,
    orders,
    carts,
    addresses,
    testimonials,
    customRequests,
    auditLogs,
    consentRecords,
    privacyRequests,
    errorEvents,
    securityEvents,
    siteSettings,
  };
}

function report(label: string, counts: Record<string, number>) {
  console.log(`\n${label}`);
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table.padEnd(18)} ${count}`);
  }
}

async function main() {
  const before = await snapshot();
  report("Current row counts:", before);

  // A reset that leaves nobody able to sign in to /admin is worse than no
  // reset — and it is unrecoverable without going back to seed.ts.
  // Skipped under --all-users, where emptying /admin is the stated intent.
  if (before.staff === 0 && !wipeAllUsers) {
    console.error(
      "\nAborting: no OWNER/ADMIN/MANAGER account exists, so this reset would " +
        "delete every user and lock everyone out of /admin. Create a staff " +
        "account first (npm run db:staff)."
    );
    process.exitCode = 1;
    return;
  }

  if (!confirmed) {
    console.log(
      "\nDRY RUN — nothing was deleted." +
        (wipeAllUsers
          ? `\n\nEVERY user would be deleted, including all ${before.staff} staff account(s).` +
            "\nOnly the site settings would be kept."
          : `\n\n${before.staff} staff account(s) and the site settings would be kept.`) +
        `\n${before.customers} customer(s), ${before.products} product(s), ` +
        `${before.combos} combo(s), ${before.orders} order(s) and all logs would be deleted.` +
        "\n\nTake a Supabase snapshot first. Then run:" +
        `\n  npm run db:reset -- --confirm${wipeAllUsers ? " --all-users" : ""}`
    );
    return;
  }

  if (wipeAllUsers) {
    console.log(
      `\n--all-users: deleting all ${before.staff} staff account(s) as well. ` +
        "Nobody will be able to sign in to /admin until `npm run db:staff` has run."
    );
  }

  console.log("\nDeleting...");

  /**
   * Order matters. ConsentRecord, PrivacyRequest, Order and AuditLog all
   * reference User with onDelete: Restrict, so users must go last or Postgres
   * rejects the delete. Children before parents throughout, even where the FK
   * cascades — an explicit delete is one less thing to be wrong about.
   *
   * One transaction: a mid-run FK failure rolls the whole thing back rather
   * than leaving a half-emptied store.
   */
  const results = await prisma.$transaction([
    prisma.cartComboSelection.deleteMany({}),
    prisma.cartItem.deleteMany({}),
    prisma.cart.deleteMany({}),
    prisma.orderItem.deleteMany({}),
    prisma.stockMovement.deleteMany({}),
    prisma.order.deleteMany({}),
    prisma.address.deleteMany({}),
    prisma.customFurnitureRequest.deleteMany({}),
    prisma.testimonial.deleteMany({}),
    prisma.comboItemOption.deleteMany({}),
    prisma.comboItem.deleteMany({}),
    prisma.combo.deleteMany({}),
    prisma.variant.deleteMany({}),
    prisma.product.deleteMany({}),
    prisma.auditLog.deleteMany({}),
    prisma.consentRecord.deleteMany({}),
    prisma.privacyRequest.deleteMany({}),
    prisma.errorEvent.deleteMany({}),
    prisma.securityEvent.deleteMany({}),
    wipeAllUsers
      ? prisma.user.deleteMany({})
      : prisma.user.deleteMany({ where: { role: "CUSTOMER" } }),
  ]);

  const deleted = results.reduce((sum, r) => sum + r.count, 0);
  console.log(`  ${deleted} row(s) removed.`);

  const after = await snapshot();
  report("Row counts after reset:", after);

  console.log(
    `\nDone. ${after.staff} staff account(s) and ${after.siteSettings} site settings row(s) kept.` +
      "\nCloudinary images were not deleted — only the rows pointing at them." +
      "\nDelete the unreferenced assets from the Cloudinary console, or they stay" +
      "\nin the account and keep counting against its storage quota." +
      "\nRe-add the catalogue at /admin/products before opening the store."
  );

  if (after.staff === 0) {
    console.log(
      "\nNO STAFF ACCOUNTS REMAIN. Run this now, on the same database:" +
        "\n  npm run db:staff" +
        "\nIt provisions the accounts with one-time passwords that must be changed" +
        "\nat first login."
    );
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
