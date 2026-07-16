import { Check, Minus } from "lucide-react";
import { requireRole } from "@/lib/auth/session";

// Mirrors the requireRole() guards in src/actions/* — update both together.
const CAPABILITIES: {
  label: string;
  roles: { OWNER: boolean; ADMIN: boolean; MANAGER: boolean; CUSTOMER: boolean };
}[] = [
  { label: "Browse store, cart, checkout", roles: { OWNER: true, ADMIN: true, MANAGER: true, CUSTOMER: true } },
  { label: "Own orders & profile (/account)", roles: { OWNER: false, ADMIN: false, MANAGER: false, CUSTOMER: true } },
  { label: "Submit custom furniture requests", roles: { OWNER: true, ADMIN: true, MANAGER: true, CUSTOMER: true } },
  { label: "Products: create, edit, delete", roles: { OWNER: true, ADMIN: true, MANAGER: true, CUSTOMER: false } },
  { label: "Inventory: receive & adjust stock", roles: { OWNER: true, ADMIN: true, MANAGER: true, CUSTOMER: false } },
  { label: "Orders: view all, update status", roles: { OWNER: true, ADMIN: true, MANAGER: true, CUSTOMER: false } },
  { label: "Combo offers: manage", roles: { OWNER: true, ADMIN: true, MANAGER: true, CUSTOMER: false } },
  { label: "Custom requests: manage pipeline", roles: { OWNER: true, ADMIN: true, MANAGER: true, CUSTOMER: false } },
  { label: "Analytics & revenue", roles: { OWNER: true, ADMIN: true, MANAGER: false, CUSTOMER: false } },
  { label: "User & role management", roles: { OWNER: true, ADMIN: true, MANAGER: false, CUSTOMER: false } },
  { label: "Website settings", roles: { OWNER: true, ADMIN: true, MANAGER: false, CUSTOMER: false } },
  { label: "Modify Owner accounts", roles: { OWNER: true, ADMIN: false, MANAGER: false, CUSTOMER: false } },
  { label: "Grant the Owner role", roles: { OWNER: true, ADMIN: false, MANAGER: false, CUSTOMER: false } },
  { label: "Change your own role", roles: { OWNER: false, ADMIN: false, MANAGER: false, CUSTOMER: false } },
  { label: "View the audit log", roles: { OWNER: true, ADMIN: false, MANAGER: false, CUSTOMER: false } },
];

const ROLE_NOTES: { role: string; note: string }[] = [
  {
    role: "Customer",
    note: "Shops the store: browse, cart, checkout, order history, profile, and custom design requests.",
  },
  {
    role: "Manager",
    note: "Sits between customer and owner. Handles day-to-day operations — products, inventory, orders, combos, and custom requests — but no analytics, user management, or site settings.",
  },
  {
    role: "Admin",
    note: "Everything a manager can do, plus analytics, user/role management, and website settings.",
  },
  {
    role: "Owner",
    note: "Full control, including managing other Owner accounts.",
  },
];

const ROLE_COLUMNS = ["OWNER", "ADMIN", "MANAGER", "CUSTOMER"] as const;

export default async function PermissionsPage() {
  await requireRole(["OWNER", "ADMIN", "MANAGER"]);

  return (
    <div>
      <h1 className="font-heading text-2xl text-foreground">
        Roles &amp; Permissions
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        What each role can do across the store and back office. Permissions
        are enforced server-side on every action.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ROLE_NOTES.map((r) => (
          <div key={r.role} className="rounded-xl border border-border p-5">
            <p className="font-heading text-base text-bronze">{r.role}</p>
            <p className="mt-2 text-sm text-muted-foreground">{r.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Capability</th>
              {ROLE_COLUMNS.map((r) => (
                <th key={r} className="px-4 py-3 text-center">
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {CAPABILITIES.map((cap) => (
              <tr key={cap.label}>
                <td className="px-4 py-3 text-foreground">{cap.label}</td>
                {ROLE_COLUMNS.map((r) => (
                  <td key={r} className="px-4 py-3 text-center">
                    {cap.roles[r] ? (
                      <Check size={15} className="mx-auto text-emerald-500" />
                    ) : (
                      <Minus
                        size={15}
                        className="mx-auto text-muted-foreground/40"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
