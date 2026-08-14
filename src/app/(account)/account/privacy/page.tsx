import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth/session";
import { getConsentHistory, resolveCurrentConsents } from "@/lib/privacy/consent";
import { PrivacyDashboard } from "@/components/account/PrivacyDashboard";
import {
  GRIEVANCE_OFFICER,
  GRIEVANCE_SLA_DAYS,
  ORDER_RETENTION_YEARS,
  PRIVACY_NOTICE_VERSION,
} from "@/lib/privacy/constants";

export const metadata: Metadata = {
  title: "Privacy & Data | MAA FURNITURE",
};

/**
 * The data principal's self-service page for their DPDP rights.
 *
 * Everything here is scoped to `session.sub` and nothing on the page accepts an
 * id from the browser — the actions it calls re-derive the user from the
 * session rather than trusting anything this component passes down.
 *
 * The summary shows counts, not contents. Someone who wants the contents can
 * download the export; rendering every address and order inline would put a
 * complete personal profile on a page that stays open in a browser tab.
 */
export default async function PrivacyAndDataPage() {
  const session = await requireAuth();

  const [counts, consentHistory, requests] = await Promise.all([
    Promise.all([
      prisma.address.count({ where: { userId: session.sub } }),
      prisma.order.count({ where: { userId: session.sub } }),
      prisma.customFurnitureRequest.count({
        where: { submittedById: session.sub },
      }),
      prisma.cartItem.count({ where: { cart: { userId: session.sub } } }),
    ]),
    getConsentHistory(session.sub),
    prisma.privacyRequest.findMany({
      where: { userId: session.sub },
      orderBy: { requestedAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        status: true,
        note: true,
        resolution: true,
        requestedAt: true,
        scheduledFor: true,
        completedAt: true,
      },
    }),
  ]);

  const [addressCount, orderCount, customRequestCount, cartItemCount] = counts;
  const current = resolveCurrentConsents(consentHistory);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl text-charcoal">Privacy &amp; Data</h1>
        <p className="text-sm text-graphite/70">
          See what we hold about you, change your mind about anything optional,
          and delete your account. Everything on this page works — nothing here
          is a form that goes nowhere.
        </p>
        <p className="text-xs text-graphite/50">
          Our current{" "}
          <Link href="/privacy" className="underline hover:text-bronze">
            Privacy Notice
          </Link>{" "}
          is version {PRIVACY_NOTICE_VERSION}.
        </p>
      </header>

      <PrivacyDashboard
        summary={{
          addressCount,
          orderCount,
          customRequestCount,
          cartItemCount,
          retentionYears: ORDER_RETENTION_YEARS,
        }}
        consents={{
          marketing: current.MARKETING_EMAIL?.status === "GRANTED",
          testimonial: current.TESTIMONIAL_PUBLICATION?.status === "GRANTED",
        }}
        consentHistory={consentHistory.map((c) => ({
          id: c.id,
          purpose: c.purpose,
          status: c.status,
          at: (c.status === "WITHDRAWN" && c.withdrawnAt
            ? c.withdrawnAt
            : c.grantedAt
          ).toISOString(),
          noticeVersion: c.noticeVersion,
          source: c.source,
        }))}
        requests={requests.map((r) => ({
          id: r.id,
          type: r.type,
          status: r.status,
          note: r.note,
          resolution: r.resolution,
          requestedAt: r.requestedAt.toISOString(),
          scheduledFor: r.scheduledFor?.toISOString() ?? null,
          completedAt: r.completedAt?.toISOString() ?? null,
        }))}
        support={{
          officerEmail: GRIEVANCE_OFFICER.email,
          slaDays: GRIEVANCE_SLA_DAYS,
        }}
      />
    </div>
  );
}
