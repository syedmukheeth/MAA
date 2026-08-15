import Image from "next/image";
import Link from "next/link";
import { FooterContactIcons } from "@/components/layout/FooterContactIcons";

/**
 * `facebookUrl` was declared here and never destructured — a dead prop that
 * three call sites were passing. Removed rather than wired up: SiteSettings
 * still holds the field, so it can be surfaced deliberately if the business
 * wants it, but a prop nothing reads is a lie about what the component does.
 */
export async function Footer({
  instagramUrl,
  whatsapp,
  deliveryMessage,
}: {
  instagramUrl?: string | null;
  whatsapp?: string;
  deliveryMessage?: string;
}) {
  const whatsappDigits = whatsapp?.replace(/[^0-9]/g, "") || "918886995345";

  return (
    <footer className="bg-charcoal text-ivory border-t border-bronze/20">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-10 lg:py-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          
          {/* Main Brand Overview */}
          <div className="max-w-xl space-y-3">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/logo.jpeg"
                alt="MAA FURNITURE"
                width={48}
                height={48}
                className="size-11 rounded-full border border-bronze/40 sm:size-12 shadow-sm"
              />
              <span className="font-heading text-xl font-bold tracking-tight text-ivory">
                MAA FURNITURE
              </span>
            </div>

            <p className="text-sm leading-relaxed text-ivory/70">
              Handcrafted furniture designed to bring timeless beauty and
              lasting comfort into every home, built to be lived in for
              generations.
              {deliveryMessage ? ` ${deliveryMessage}.` : ""}
            </p>
          </div>

          {/*
            Legal links. DPDP §5 wants the privacy notice reachable from
            everywhere data is collected, and the footer is the one surface on
            every page. These routes are public in src/proxy.ts — if they ever
            start redirecting to /login, that list is why.
          */}
          <div className="space-y-3">
            <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-bronze">
              Legal
            </h4>
            <ul className="space-y-2 text-sm text-ivory/70">
              <li>
                <Link href="/privacy" className="hover:text-bronze">
                  Privacy Notice
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-bronze">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/grievance" className="hover:text-bronze">
                  Grievance Redressal
                </Link>
              </li>
              <li>
                <Link href="/showroom" className="hover:text-bronze">
                  Showroom
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Icons */}
          <div className="space-y-3">
            <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-bronze">
              Get In Touch
            </h4>

            <FooterContactIcons
              instagramUrl={instagramUrl}
              whatsappDigits={whatsappDigits}
            />
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ivory/10 pt-8 text-center text-xs text-ivory/50 sm:flex-row sm:text-left">
          <p>&copy; {new Date().getFullYear()} MAA FURNITURE. All rights reserved.</p>
          <p className="font-medium text-ivory/70">
            Crafted with care, by{" "}
            <a
              href="https://sampeer-studio.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bronze font-semibold underline-offset-4 hover:underline"
            >
              SAMPeer Studio
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
