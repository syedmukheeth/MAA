import Image from "next/image";
import { FooterContactIcons } from "@/components/layout/FooterContactIcons";

export async function Footer({
  instagramUrl,
  whatsapp,
  deliveryMessage,
}: {
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  whatsapp?: string;
  deliveryMessage?: string;
}) {
  const whatsappDigits = whatsapp?.replace(/[^0-9]/g, "") || "918886995345";

  return (
    <footer className="bg-charcoal text-ivory border-t border-bronze/20">
      <div className="mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:px-10 lg:py-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          
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
            Crafted with care, by <span className="text-bronze font-semibold">SAMPeer Studio</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}
