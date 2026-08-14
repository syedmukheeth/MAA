import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import { LegalPage, Section } from "@/components/legal/LegalPage";
import { PublicGrievanceForm } from "@/components/legal/PublicGrievanceForm";
import {
  ERASURE_COOLING_OFF_DAYS,
  GRIEVANCE_OFFICER,
  GRIEVANCE_SLA_DAYS,
  isGrievanceOfficerConfigured,
} from "@/lib/privacy/constants";

export const metadata: Metadata = {
  title: "Grievance Redressal | MAA FURNITURE",
  description:
    "Raise a complaint about how MAA FURNITURE handles your personal data, and escalate to the Data Protection Board of India.",
};

/**
 * The DPDP §13 grievance channel.
 *
 * Public in src/proxy.ts and deliberately usable without an account: the people
 * most likely to need it are someone whose account we locked pending erasure
 * and wants to cancel, and someone who never had an account but whose data we
 * hold anyway. Requiring a login here would fail exactly the cases the right
 * exists for.
 */
export default async function GrievancePage() {
  const settings = await getSiteSettings();
  const officerPhone = GRIEVANCE_OFFICER.phone ?? settings.showroomPhone;
  const officerConfigured = isGrievanceOfficerConfigured();

  return (
    <LegalPage
      title="Grievance Redressal"
      subtitle="If something about how we handle your personal information is wrong, tell us here. We read every one of these."
    >
      <Section heading="If you have an account">
        <p>
          Most things are faster to do yourself at{" "}
          <Link href="/account/privacy" className="text-bronze underline">
            Account → Privacy &amp; Data
          </Link>{" "}
          — downloading your data, turning marketing emails off, or deleting your
          account. Use the form below if that is not working, or if your
          complaint is about something else.
        </p>
      </Section>

      <Section heading="If you asked us to delete your account and changed your mind">
        <p>
          Your account is locked but your data is still there for{" "}
          {ERASURE_COOLING_OFF_DAYS} days after you asked. Use the form below
          with the email address on the account and say you want to cancel the
          deletion, and we will restore it. After that window the data is gone
          and we cannot bring it back.
        </p>
      </Section>

      <Section heading="Raise a complaint">
        <PublicGrievanceForm />
      </Section>

      <Section heading="Who handles it">
        <p>
          Complaints go to our Data Protection Officer
          {officerConfigured ? `, ${GRIEVANCE_OFFICER.name}` : ""}. You can also
          contact them directly:
        </p>
        <ul className="list-none space-y-1 pl-0">
          <li>
            <strong>Email:</strong>{" "}
            <a
              href={`mailto:${GRIEVANCE_OFFICER.email}`}
              className="text-bronze underline"
            >
              {GRIEVANCE_OFFICER.email}
            </a>
          </li>
          <li>
            <strong>Phone:</strong> {officerPhone}
          </li>
          <li>
            <strong>Address:</strong> {settings.showroomAddress}
          </li>
        </ul>
        <p>We respond within {GRIEVANCE_SLA_DAYS} days.</p>
      </Section>

      <Section heading="If you are not satisfied with our answer">
        <p>
          You have the right to complain to the{" "}
          <strong>Data Protection Board of India</strong> under the Digital
          Personal Data Protection Act, 2023. You do not need our permission, and
          we will not treat you any differently for doing so.
        </p>
      </Section>
    </LegalPage>
  );
}
