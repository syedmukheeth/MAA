import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import { LegalPage, Section, DataTable } from "@/components/legal/LegalPage";
import {
  GRIEVANCE_OFFICER,
  GRIEVANCE_SLA_DAYS,
  ERASURE_COOLING_OFF_DAYS,
  ORDER_RETENTION_YEARS,
  PRIVACY_NOTICE_EFFECTIVE_DATE,
  PRIVACY_NOTICE_VERSION,
  isGrievanceOfficerConfigured,
} from "@/lib/privacy/constants";

export const metadata: Metadata = {
  title: "Privacy Notice | MAA FURNITURE",
  description:
    "What personal data MAA FURNITURE collects, why, how long we keep it, and how to exercise your rights under India's DPDP Act 2023.",
};

/**
 * The standalone privacy notice required by DPDP §5 and the DPDP Rules 2025.
 *
 * Written to be read, not to be defensible: plain sentences, an itemised table
 * rather than a paragraph, and an honest statement of the two places where our
 * answer is "we have to keep this" rather than "you can delete it". The version
 * constant is rendered so a consent record pointing at it can be matched to the
 * text that was actually shown.
 *
 * This page is public in src/proxy.ts. It must never require a session.
 */
export default async function PrivacyNoticePage() {
  const settings = await getSiteSettings();
  const officerPhone = GRIEVANCE_OFFICER.phone ?? settings.showroomPhone;
  const officerConfigured = isGrievanceOfficerConfigured();

  return (
    <LegalPage
      title="Privacy Notice"
      subtitle="This explains what personal information MAA FURNITURE collects about you, why we need it, who else sees it, and what you can ask us to do about it."
      version={PRIVACY_NOTICE_VERSION}
      effectiveDate={PRIVACY_NOTICE_EFFECTIVE_DATE}
    >
      {!officerConfigured && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-900">
          <strong>Setup incomplete.</strong> The name of our Data Protection
          Officer has not been filled in yet. Until it is, please use the contact
          details at the bottom of this page and we will route your request to
          the right person.
        </div>
      )}

      <Section heading="Who we are">
        <p>
          MAA FURNITURE sells and makes furniture in Kurnool, Andhra Pradesh. When
          you use this website, we decide what happens to your personal
          information, which under the Digital Personal Data Protection Act, 2023
          makes us the <em>Data Fiduciary</em> and you the{" "}
          <em>Data Principal</em>.
        </p>
        <p>Our showroom is at {settings.showroomAddress}.</p>
      </Section>

      <Section heading="What we collect and why">
        <p>
          We only collect what we need to sell you furniture and deliver it. We do
          not collect your date of birth, your gender, your location, or anything
          about you from other websites. We do not use analytics or advertising
          trackers, and there are no tracking cookies on this site.
        </p>
        <DataTable
          rows={[
            {
              what: "Your name and email address",
              why: "To create your account, sign you in, and email you about your orders.",
              basis: "Needed to provide the account and shop you asked for",
              kept: "Until you delete your account",
            },
            {
              what: "Your password",
              why: "To sign you in.",
              basis: "Needed to provide your account",
              kept: "Stored only as a scrambled one-way hash. We cannot read it.",
            },
            {
              what: "Delivery address and phone number",
              why: "To deliver your furniture and call you if the driver cannot find you.",
              basis: "Needed to fulfil your order",
              kept: "Saved addresses until you delete them; a copy on each order for " +
                `${ORDER_RETENTION_YEARS} years`,
            },
            {
              what: "Your orders and invoices",
              why: "To fulfil the order, handle returns and refunds, and file our taxes.",
              basis: "Needed to fulfil your order, then required by Indian tax law",
              kept: `${ORDER_RETENTION_YEARS} years, as the Companies Act and GST rules require`,
            },
            {
              what: "Custom furniture enquiries — your name, phone, photos and description",
              why: "To understand what you want built and to call you with a quote.",
              basis: "Steps towards a contract, at your request",
              kept: "Deleted when the enquiry closes; if it becomes an order, the build specification is kept for warranty",
            },
            {
              what: "Marketing emails",
              why: "To tell you about new arrivals and offers.",
              basis: "Your consent — you can withdraw it at any time",
              kept: "Until you withdraw consent",
            },
            {
              what: "Your testimonial, if you give us one",
              why: "To show it on our website with your name and city.",
              basis: "Your consent — you can withdraw it at any time",
              kept: "Until you withdraw consent",
            },
            {
              what: "Your IP address",
              why: "To stop bots and password-guessing attacks.",
              basis: "Security of our service",
              kept: "Under one hour, then automatically discarded",
            },
          ]}
        />
      </Section>

      <Section heading="What we do NOT do">
        <ul className="list-disc space-y-1 pl-5">
          <li>We never sell your personal information.</li>
          <li>We do not advertise to you on other websites.</li>
          <li>We do not use analytics or tracking cookies.</li>
          <li>We do not send your personal information to any AI service.</li>
          <li>
            We do not profile you or make automated decisions about you.
          </li>
          <li>
            We do not knowingly collect information from children — see below.
          </li>
        </ul>
      </Section>

      <Section heading="Who else sees your information">
        <p>
          We use a small number of companies to run the website. They only handle
          your data to do a job for us, and they are not allowed to use it for
          anything else.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Supabase</strong> — stores our database, which holds your
            account, addresses and orders. Its servers are in Seoul, South
            Korea.
          </li>
          <li>
            <strong>Vercel</strong> — runs the website itself. Our servers are
            currently in Seoul, South Korea.
          </li>
          <li>
            <strong>Resend</strong> — sends the emails we send you, so it sees
            your email address and the contents of the message.
          </li>
          <li>
            <strong>Cloudinary</strong> — stores images, including any photo you
            upload with a custom furniture enquiry.
          </li>
          <li>
            <strong>Upstash</strong> — briefly holds security counters used to
            block password-guessing.
          </li>
          <li>
            <strong>Google Maps</strong> — only if you choose to load the map on
            our showroom page. It does not load until you click it.
          </li>
        </ul>
        <p>
          <strong>Processing outside India.</strong> Some of these companies
          process your data on servers outside India, including our website
          servers in South Korea. Section 16 of the DPDP Act permits this except
          to countries the Government of India has restricted; none of the
          countries we use is currently restricted.
        </p>
      </Section>

      <Section heading="Your rights">
        <p>
          If you have an account, you can do most of this yourself at{" "}
          <Link href="/account/privacy" className="text-bronze underline">
            Account → Privacy &amp; Data
          </Link>
          .
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>See what we hold.</strong> Download everything we have about
            you as a file.
          </li>
          <li>
            <strong>Correct it.</strong> Change your name and password yourself;
            ask us to fix your email address or a past delivery address.
          </li>
          <li>
            <strong>Withdraw consent.</strong> Turn off marketing emails or take
            your testimonial down, with one click. It is exactly as easy as
            turning it on.
          </li>
          <li>
            <strong>Delete your account.</strong> We lock it immediately and
            erase your data after {ERASURE_COOLING_OFF_DAYS} days, so an
            accidental deletion can be undone.
          </li>
          <li>
            <strong>Complain.</strong> Use our{" "}
            <Link href="/grievance" className="text-bronze underline">
              grievance page
            </Link>
            . If you are not happy with our answer, you may complain to the Data
            Protection Board of India.
          </li>
          <li>
            <strong>Nominate someone.</strong> You may ask us to let a person you
            name exercise these rights if you die or become unable to. Contact us
            to arrange this.
          </li>
        </ul>
      </Section>

      <Section heading="What happens when you delete your account">
        <p>
          We delete your account, your saved addresses, your cart, any custom
          furniture enquiries that did not become orders, and any photos you
          uploaded.
        </p>
        <p>
          We <strong>cannot</strong> delete the invoices for orders you have
          already placed — Indian tax and company law requires us to keep those
          for {ORDER_RETENTION_YEARS} years. What we do instead is remove your
          name, phone number, street address and pincode from them, leaving only
          the amounts, the dates and the state, which is what the tax record
          actually needs.
        </p>
        <p>
          If you have an order still on its way, we cannot delete your details
          until it arrives — we still need them to deliver it. We record your
          request and complete it automatically once the order is done.
        </p>
      </Section>

      <Section heading="Children">
        <p>
          This website sells furniture and is meant for adults. We do not
          knowingly collect information from anyone under 18, and we do not
          advertise to or profile children. If you believe a child has created an
          account, contact us and we will delete it.
        </p>
      </Section>

      <Section heading="Keeping your data safe">
        <p>
          Passwords are stored as one-way hashes and never in readable form.
          Traffic to this site is encrypted. Signing in uses a secure,
          browser-only session cookie that cannot be read by scripts. Only staff
          who need to see an order can see it, and every staff action on your
          account is logged.
        </p>
        <p>
          If a breach happens that affects you, we will tell you and the Data
          Protection Board of India, as Section 8(6) of the Act requires.
        </p>
      </Section>

      <Section heading="Contact us">
        <p>
          For anything about your personal data, contact our Data Protection
          Officer:
        </p>
        <ul className="list-none space-y-1 pl-0">
          <li>
            <strong>Name:</strong>{" "}
            {officerConfigured ? GRIEVANCE_OFFICER.name : "To be confirmed"}
          </li>
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
        <p>
          We answer within {GRIEVANCE_SLA_DAYS} days. If you are not satisfied,
          you may complain to the Data Protection Board of India.
        </p>
      </Section>

      <Section heading="Changes to this notice">
        <p>
          This is version {PRIVACY_NOTICE_VERSION}, effective{" "}
          {PRIVACY_NOTICE_EFFECTIVE_DATE}. When we change anything substantial we
          publish a new version number here. Your account records which version
          you agreed to for each thing you consented to, and you can see that
          history on your privacy page.
        </p>
        <p>
          If you would prefer this notice in Telugu or Hindi, ask us and we will
          provide it.
        </p>
      </Section>
    </LegalPage>
  );
}
