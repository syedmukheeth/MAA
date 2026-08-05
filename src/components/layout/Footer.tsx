import Link from "next/link";
import Image from "next/image";
import { hasPublishedTestimonials } from "@/lib/testimonials";
import { FooterContactIcons } from "@/components/layout/FooterContactIcons";

type FooterLink = { label: string; href: string };

const COLLECTIONS_LINKS: FooterLink[] = [
  { label: "Living Room", href: "/products?category=LIVING_ROOM" },
  { label: "Bedroom", href: "/products?category=BEDROOM" },
  { label: "Dining", href: "/products?category=DINING" },
  { label: "Office", href: "/products?category=OFFICE" },
  { label: "Outdoor", href: "/products?category=OUTDOOR" },
];

const STUDIO_COMPANY_LINKS: FooterLink[] = [
  { label: "Custom Furniture Studio", href: "/custom-studio" },
  { label: "Combo Offers", href: "/combos" },
  { label: "Showroom & Inspirations", href: "/showroom" },
  { label: "Our Story", href: "/#about" },
  { label: "All Products", href: "/products" },
];

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
  const showReviews = await hasPublishedTestimonials();

  const studioLinks = showReviews
    ? [
        ...STUDIO_COMPANY_LINKS.slice(0, 3),
        { label: "Customer Reviews", href: "/#testimonials" },
        ...STUDIO_COMPANY_LINKS.slice(3),
      ]
    : STUDIO_COMPANY_LINKS;

  return (
    <footer className="bg-charcoal text-ivory border-t border-bronze/20">
      <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16 lg:px-10 lg:py-20">
        <div className="grid grid-cols-1 gap-y-12 gap-x-8 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.1fr] lg:gap-10">
          
          {/* Column 1: Brand Overview */}
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/logo.jpeg"
                alt="MAA FURNITURE"
                width={48}
                height={48}
                className="size-11 rounded-full border border-bronze/40 sm:size-12 shadow-sm"
              />
              <span className="font-heading text-lg font-bold sm:text-xl tracking-tight text-ivory">
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

          {/* Column 2: Collections */}
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-bronze">
              Collections
            </h4>
            <ul className="mt-5 space-y-3 text-sm">
              {COLLECTIONS_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-ivory/70 transition-colors hover:text-ivory hover:underline underline-offset-4"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Studio & Company */}
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-bronze">
              Studio & Info
            </h4>
            <ul className="mt-5 space-y-3 text-sm">
              {studioLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-ivory/70 transition-colors hover:text-ivory hover:underline underline-offset-4"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Connect & Location */}
          <div className="space-y-4">
            <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-bronze">
              Get In Touch
            </h4>

            <p className="text-xs text-ivory/60">
              Click any icon below to call, chat, email, or locate our Kurnool showroom.
            </p>

            <FooterContactIcons
              instagramUrl={instagramUrl}
              whatsappDigits={whatsappDigits}
            />
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-ivory/10 pt-8 text-center text-xs text-ivory/50 sm:flex-row sm:text-left">
          <p>&copy; {new Date().getFullYear()} MAA FURNITURE. All rights reserved.</p>
          <p className="font-medium text-ivory/70">
            Crafted with care, by <span className="text-bronze font-semibold">SAMPeer Studio</span>.
          </p>
        </div>
      </div>
    </footer>
  );
}
