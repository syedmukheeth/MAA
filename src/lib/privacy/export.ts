import { prisma } from "@/lib/db";
import { PRIVACY_NOTICE_VERSION } from "./constants";
import { CONSENT_PURPOSE_LABELS } from "./labels";

/**
 * Assembling everything we hold about one person, for the DPDP right of access.
 *
 * Every query below uses an explicit allow-list `select`. That is the whole
 * safety property of this file: an exclude-list would silently start exporting
 * any column added to the schema later, and the two columns that must never
 * leave the server — passwordHash and tokenVersion — live on the very table
 * this export starts from. export.test.ts walks the produced object for those
 * keys so a future schema change fails a test rather than a customer.
 *
 * The result is returned to the caller as a string and streamed to the browser
 * as a download. It is deliberately never written to disk or given a URL: a
 * signed link is a second copy of everything, sitting outside the session that
 * authorised it.
 */

export type DataExport = Awaited<ReturnType<typeof buildDataExport>>;

export async function buildDataExport(userId: string) {
  const [user, addresses, orders, customRequests, consents, requests, auditEntries] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      prisma.address.findMany({
        where: { userId },
        select: {
          id: true,
          label: true,
          name: true,
          phone: true,
          line1: true,
          line2: true,
          city: true,
          state: true,
          pincode: true,
          isDefault: true,
          createdAt: true,
        },
      }),

      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: {
          orderNumber: true,
          status: true,
          subtotal: true,
          deliveryFee: true,
          taxRate: true,
          taxAmount: true,
          total: true,
          paymentMethod: true,
          cancelReason: true,
          refundStatus: true,
          refundAmount: true,
          refundedAt: true,
          shippingName: true,
          shippingPhone: true,
          shippingLine1: true,
          shippingLine2: true,
          shippingCity: true,
          shippingState: true,
          shippingPincode: true,
          createdAt: true,
          items: {
            select: {
              name: true,
              variantName: true,
              optionsSummary: true,
              unitPrice: true,
              quantity: true,
              lineTotal: true,
            },
          },
        },
      }),

      prisma.customFurnitureRequest.findMany({
        where: { submittedById: userId },
        orderBy: { createdAt: "desc" },
        select: {
          name: true,
          phone: true,
          inspirationUrl: true,
          imageUrl: true,
          dimensions: true,
          wood: true,
          finish: true,
          budgetRange: true,
          description: true,
          customOptions: true,
          status: true,
          createdAt: true,
        },
      }),

      prisma.consentRecord.findMany({
        where: { userId },
        orderBy: { grantedAt: "desc" },
        select: {
          purpose: true,
          status: true,
          grantedAt: true,
          withdrawnAt: true,
          noticeVersion: true,
          source: true,
        },
      }),

      prisma.privacyRequest.findMany({
        where: { userId },
        orderBy: { requestedAt: "desc" },
        select: {
          type: true,
          status: true,
          note: true,
          resolution: true,
          requestedAt: true,
          scheduledFor: true,
          completedAt: true,
        },
      }),

      // Audit entries ABOUT this person, not ones they performed. A customer's
      // own actions are not audited; what exists here is staff activity against
      // their account (role changes, suspensions), which they are entitled to
      // see. `metadata` is withheld — it can carry a third party's details from
      // the same action, and disclosing those would be a fresh breach.
      prisma.auditLog.findMany({
        where: { entity: "User", entityId: userId },
        orderBy: { createdAt: "desc" },
        select: { action: true, summary: true, createdAt: true },
      }),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
    about:
      "This file contains the personal data MAA FURNITURE holds about you. Amounts are in INR. Dates are UTC.",
    account: user,
    savedAddresses: addresses,
    orders,
    customFurnitureRequests: customRequests,
    consentHistory: consents.map((c) => ({
      ...c,
      purposeLabel: CONSENT_PURPOSE_LABELS[c.purpose],
    })),
    privacyRequests: requests,
    accountAdministrationHistory: auditEntries,
    notIncluded: [
      "Your password — we only ever store a one-way hash of it and cannot read it.",
      "Your wishlist — it is stored in your own browser and never sent to us.",
      "Security rate-limiting counters — these expire within an hour and are not linked to your account record.",
    ],
  };
}

/**
 * Serialises the export. Split from the query so tests can feed a fixture
 * through the exact function the download uses.
 *
 * Prisma Decimal instances stringify to their numeric value through toJSON, and
 * Dates to ISO-8601, which is what an export should contain.
 */
export function serialiseExport(data: unknown): string {
  return JSON.stringify(data, null, 2);
}
