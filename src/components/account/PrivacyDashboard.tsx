"use client";

import Link from "next/link";
import { ConsentToggles, type ConsentHistoryRow } from "./ConsentToggles";
import { DataExportCard } from "./DataExportCard";
import { CorrectionForm } from "./CorrectionForm";
import { GrievanceForm } from "./GrievanceForm";
import { DeleteAccountDialog } from "./DeleteAccountDialog";

export type PrivacyRequestRow = {
  id: string;
  type: "EXPORT" | "CORRECTION" | "ERASURE" | "GRIEVANCE";
  status:
    | "PENDING"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "REJECTED"
    | "ON_HOLD"
    | "CANCELLED";
  note: string | null;
  resolution: string | null;
  requestedAt: string;
  scheduledFor: string | null;
  completedAt: string | null;
};

/**
 * Client shell for /account/privacy.
 *
 * Takes only plain serialisable summaries — no Prisma rows and no user id. The
 * server actions each card calls derive the user from the session, so nothing
 * here needs to be trusted.
 */
export function PrivacyDashboard({
  summary,
  consents,
  consentHistory,
  requests,
  support,
}: {
  summary: {
    addressCount: number;
    orderCount: number;
    customRequestCount: number;
    cartItemCount: number;
    retentionYears: number;
  };
  consents: { marketing: boolean; testimonial: boolean };
  consentHistory: ConsentHistoryRow[];
  requests: PrivacyRequestRow[];
  support: { officerEmail: string; slaDays: number };
}) {
  const openErasure = requests.find(
    (r) => r.type === "ERASURE" && (r.status === "PENDING" || r.status === "ON_HOLD")
  );

  return (
    <div className="space-y-10">
      <Card
        title="What we hold about you"
        description="A summary. Download the file below to see the actual contents."
      >
        <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <Stat label="Saved addresses" value={summary.addressCount} />
          <Stat label="Orders" value={summary.orderCount} />
          <Stat label="Custom enquiries" value={summary.customRequestCount} />
          <Stat label="Items in cart" value={summary.cartItemCount} />
        </dl>
        <p className="mt-4 text-xs text-graphite/50">
          We also hold your name, email address and a scrambled one-way hash of
          your password, which we cannot read. Your wishlist is stored in this
          browser only and never reaches us.
        </p>
      </Card>

      <Card
        title="Download your data"
        description="Everything we hold about you, as a file you can keep."
      >
        <DataExportCard />
      </Card>

      <Card
        title="Optional permissions"
        description="These are the only two things we do that need your permission. Turning either off changes nothing about your orders or your account."
      >
        <ConsentToggles
          marketing={consents.marketing}
          testimonial={consents.testimonial}
          history={consentHistory}
        />
      </Card>

      <Card
        title="Correct your information"
        description="Your name and password are yours to change directly."
      >
        <p className="mb-4 text-sm text-graphite/70">
          Change your name or password on the{" "}
          <Link href="/account" className="text-bronze underline">
            Profile
          </Link>{" "}
          page. For your email address or the delivery address on a past order,
          we have to make the change ourselves — your email is how you sign in,
          and past addresses are part of a tax invoice.
        </p>
        <CorrectionForm />
      </Card>

      <Card
        title="Your requests"
        description={`We respond to everything within ${support.slaDays} days.`}
      >
        <RequestList requests={requests} />
      </Card>

      <Card
        title="Raise a complaint"
        description="If we have handled your information badly, tell us. You can also complain to the Data Protection Board of India at any time."
      >
        <GrievanceForm />
        <p className="mt-4 text-xs text-graphite/50">
          You can also email{" "}
          <a
            href={`mailto:${support.officerEmail}`}
            className="underline hover:text-bronze"
          >
            {support.officerEmail}
          </a>
          .
        </p>
      </Card>

      <Card
        title="Delete your account"
        description="This cannot be undone once it runs."
      >
        {openErasure ? (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900">
            {openErasure.status === "ON_HOLD" ? (
              <>
                Your deletion request is on hold until your open order is
                delivered or cancelled. We will complete it automatically — you
                do not need to ask again.
              </>
            ) : (
              <>
                Your account is scheduled for deletion
                {openErasure.scheduledFor
                  ? ` on ${formatDate(openErasure.scheduledFor)}`
                  : ""}
                . To cancel, contact us through the{" "}
                <Link href="/grievance" className="underline">
                  grievance page
                </Link>
                .
              </>
            )}
          </div>
        ) : (
          <DeleteAccountDialog retentionYears={summary.retentionYears} />
        )}
      </Card>
    </div>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-linen bg-white p-6">
      <h2 className="font-heading text-lg text-charcoal">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-graphite/60">{description}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-graphite/50">
        {label}
      </dt>
      <dd className="mt-1 font-heading text-2xl text-charcoal">{value}</dd>
    </div>
  );
}

function RequestList({ requests }: { requests: PrivacyRequestRow[] }) {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-graphite/60">
        You have not made any requests yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {requests.map((r) => (
        <li
          key={r.id}
          className="rounded-lg border border-linen bg-cream/50 p-4 text-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-charcoal">
              {REQUEST_TYPE_LABELS[r.type]}
            </span>
            <span className="rounded-full bg-sand px-2 py-0.5 text-xs text-graphite/70">
              {REQUEST_STATUS_LABELS[r.status]}
            </span>
            <span className="text-xs text-graphite/50">
              {formatDate(r.requestedAt)}
            </span>
          </div>
          {r.note && <p className="mt-2 text-graphite/70">{r.note}</p>}
          {r.resolution && (
            <p className="mt-2 text-graphite/80">
              <strong>Our response:</strong> {r.resolution}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

const REQUEST_TYPE_LABELS: Record<PrivacyRequestRow["type"], string> = {
  EXPORT: "Data download",
  CORRECTION: "Correction",
  ERASURE: "Account deletion",
  GRIEVANCE: "Complaint",
};

const REQUEST_STATUS_LABELS: Record<PrivacyRequestRow["status"], string> = {
  PENDING: "Received",
  IN_PROGRESS: "Being handled",
  COMPLETED: "Done",
  REJECTED: "Declined",
  ON_HOLD: "On hold",
  CANCELLED: "Cancelled",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
