import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/site-settings";
import { LegalPage, Section } from "@/components/legal/LegalPage";
import { PRIVACY_NOTICE_EFFECTIVE_DATE } from "@/lib/privacy/constants";

export const metadata: Metadata = {
  title: "Terms | MAA FURNITURE",
  description:
    "Terms for buying furniture from MAA FURNITURE — orders, delivery in Andhra Pradesh, payment, cancellation and returns.",
};

/**
 * Terms of sale.
 *
 * Kept factual and limited to what the code actually does — delivery is
 * restricted to Andhra Pradesh by the checkout validator, payment is Cash on
 * Delivery, and customers can cancel their own order before it ships. Promising
 * anything the application does not do would be worse than saying nothing.
 *
 * The commercial specifics (warranty length, return window, refund timing) are
 * business decisions, marked below where the operator must confirm them.
 */
export default async function TermsPage() {
  const settings = await getSiteSettings();

  return (
    <LegalPage
      title="Terms"
      subtitle="The terms on which we sell furniture through this website."
      effectiveDate={PRIVACY_NOTICE_EFFECTIVE_DATE}
    >
      <Section heading="Who you are buying from">
        <p>
          MAA FURNITURE, {settings.showroomAddress}. You can reach us on{" "}
          {settings.showroomPhone}.
        </p>
      </Section>

      <Section heading="Your account">
        <p>
          You need an account to place an order. Keep your password to yourself —
          anything done through your account is treated as done by you. Tell us
          straight away if you think someone else has access, and change your
          password, which signs out every other device.
        </p>
        <p>
          You must be 18 or older to buy from this website.
        </p>
      </Section>

      <Section heading="Prices and payment">
        <p>
          All prices are in Indian Rupees and include GST at the rate shown on
          your order. Delivery charges, where they apply, are shown before you
          confirm.
        </p>
        <p>
          Orders are paid by Cash on Delivery. The price you see when you place
          the order is the price you pay, even if the listed price changes
          afterwards.
        </p>
      </Section>

      <Section heading="Delivery">
        <p>
          We currently deliver only within Andhra Pradesh. Checkout will not
          accept an address outside the state. If you are elsewhere, call us on{" "}
          {settings.showroomPhone} and we will tell you what is possible.
        </p>
        <p>
          Furniture is made and delivered to the address on your order. Please
          make sure someone can receive it and that it will fit through your
          doors and stairs.
        </p>
      </Section>

      <Section heading="Cancelling and returns">
        <p>
          You can cancel an order yourself from your account at any time before
          it ships. Once it has shipped, call us and we will do what we can.
        </p>
        <p>
          Custom-made furniture is built to your specification and cannot be
          cancelled once production has started.
        </p>
        <p className="text-graphite/60">
          Return window, warranty period and refund timelines are set out on your
          invoice and confirmed by our staff when you order.
        </p>
      </Section>

      <Section heading="Custom furniture enquiries">
        <p>
          A custom enquiry is a request for a quote, not an order. Nothing is
          confirmed and nothing is charged until we have spoken to you and agreed
          the specification and the price.
        </p>
      </Section>

      <Section heading="Your personal information">
        <p>
          How we handle your personal information is set out separately in our{" "}
          <Link href="/privacy" className="text-bronze underline">
            Privacy Notice
          </Link>
          . If you have a complaint about it, use our{" "}
          <Link href="/grievance" className="text-bronze underline">
            grievance page
          </Link>
          .
        </p>
      </Section>

      <Section heading="Governing law">
        <p>
          These terms are governed by the laws of India, and the courts of
          Kurnool, Andhra Pradesh have jurisdiction over any dispute.
        </p>
      </Section>
    </LegalPage>
  );
}
