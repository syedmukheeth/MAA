import Link from "next/link";
import Image from "next/image";
import { AtSign, Globe, MessageCircle, Phone, ArrowRight, Sparkles } from "lucide-react";
import { hasPublishedTestimonials } from "@/lib/testimonials";

type FooterLink = { label: string; href: string };

const COLLECTIONS_LINKS: FooterLink[] = [
  { label: "Living Room", href: "/products?category=LIVING_ROOM" },
  { label: "Bedroom", href: "/products?category=BEDROOM" },
  { label: "Dining", href: "/products?category=DINING" },
  { label: "Office", href: "/products?category=OFFICE" },
  { label: "Outdoor", href: "/products?category=OUTDOOR" },
];

const STUDIO_COMPANY_LINKS: FooterLink[] = [
  { label: "Custom Furniture", href: "/custom-studio" },
  { label: "Combo Offers", href: "/combos" },
  { label: "Showroom & Inspirations", href: "/showroom" },
  { label: "Our Story", href: "/#about" },
  { label: "All Products", href: "/products" },
];

export async function Footer({
  instagramUrl,
  facebookUrl,
  whatsapp,
  deliveryMessage,
}: {
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  whatsapp?: string;
  deliveryMessage?: string;
}) {
  const whatsappDigits = whatsapp?.replace(/[^0-9]/g, "");
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
        <div className="grid grid-cols-1 gap-y-12 gap-x-8 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          
          {/* Column 1: Brand & Contact Info */}
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

            <div className="space-y-2 pt-1 text-xs">
              <a
                href="tel:8886995345"
                className="flex items-center gap-2 text-ivory/80 hover:text-bronze transition-colors"
              >
                <Phone size={14} className="text-bronze shrink-0" />
                <span>Primary: <strong className="font-semibold text-ivory">8886995345</strong></span>
              </a>
              <a
                href="tel:9912330151"
                className="flex items-center gap-2 text-ivory/80 hover:text-bronze transition-colors"
              >
                <Phone size={14} className="text-bronze shrink-0" />
                <span>Secondary: <strong className="font-semibold text-ivory">9912330151</strong></span>
              </a>
            </div>

            <div className="flex gap-3 pt-2">
              <a
                href={instagramUrl || "#"}
                target={instagramUrl ? "_blank" : undefined}
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="rounded-full border border-ivory/20 p-2.5 text-ivory/70 transition-colors hover:border-bronze hover:text-bronze hover:bg-bronze/10"
              >
                <AtSign size={16} />
              </a>
              <a
                href={facebookUrl || "#"}
                target={facebookUrl ? "_blank" : undefined}
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="rounded-full border border-ivory/20 p-2.5 text-ivory/70 transition-colors hover:border-bronze hover:text-bronze hover:bg-bronze/10"
              >
                <Globe size={16} />
              </a>
              <a
                href={whatsappDigits ? `https://wa.me/${whatsappDigits}` : "#"}
                target={whatsappDigits ? "_blank" : undefined}
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="rounded-full border border-ivory/20 p-2.5 text-ivory/70 transition-colors hover:border-bronze hover:text-bronze hover:bg-bronze/10"
              >
                <MessageCircle size={16} />
              </a>
            </div>
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

          {/* Column 4: Quick Custom Furniture Card */}
          <div className="rounded-2xl border border-bronze/30 bg-gradient-to-b from-white/5 to-white/0 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-bronze text-xs font-bold uppercase tracking-wider">
                <Sparkles size={14} />
                <span>Custom Furniture</span>
              </div>
              <h5 className="mt-2 font-heading text-base font-medium text-ivory">
                Have a unique vision for your home?
              </h5>
              <p className="mt-2 text-xs leading-relaxed text-ivory/60">
                Craft bespoke furniture tailored to your exact dimensions, wood preferences, and finishes.
              </p>
            </div>
            <Link
              href="/custom-studio"
              className="mt-6 flex items-center justify-between rounded-full bg-bronze px-4 py-2.5 text-xs font-semibold text-ivory hover:bg-bronze/90 transition-colors shadow-sm"
            >
              <span>Design Your Piece</span>
              <ArrowRight size={14} />
            </Link>
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
