import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, MessageCircle } from "lucide-react";
import { hasPublishedTestimonials } from "@/lib/testimonials";

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

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

          {/* Column 4: Contact & Connect */}
          <div className="space-y-4">
            <h4 className="font-heading text-xs font-bold uppercase tracking-widest text-bronze">
              Get In Touch
            </h4>

            {/* Direct Contact Buttons with Logos */}
            <div className="space-y-2.5">
              <a
                href="tel:8886995345"
                className="flex items-center gap-3 rounded-xl border border-ivory/15 bg-white/5 px-3.5 py-2.5 text-xs font-medium text-ivory transition-all hover:border-bronze hover:bg-bronze/10 hover:text-bronze"
              >
                <Phone size={15} className="text-bronze shrink-0" />
                <span>Primary: <strong>8886995345</strong></span>
              </a>

              <a
                href="tel:9912330151"
                className="flex items-center gap-3 rounded-xl border border-ivory/15 bg-white/5 px-3.5 py-2.5 text-xs font-medium text-ivory transition-all hover:border-bronze hover:bg-bronze/10 hover:text-bronze"
              >
                <Phone size={15} className="text-bronze shrink-0" />
                <span>Secondary: <strong>9912330151</strong></span>
              </a>

              <a
                href="mailto:maafurniture.shop@gmail.com"
                className="flex items-center gap-3 rounded-xl border border-ivory/15 bg-white/5 px-3.5 py-2.5 text-xs font-medium text-ivory transition-all hover:border-bronze hover:bg-bronze/10 hover:text-bronze"
              >
                <Mail size={15} className="text-bronze shrink-0" />
                <span className="truncate">maafurniture.shop@gmail.com</span>
              </a>
            </div>

            {/* Social & Messaging Icon Links */}
            <div className="flex gap-3 pt-2">
              <a
                href={instagramUrl || "https://instagram.com"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="rounded-full border border-ivory/20 p-2.5 text-ivory/70 transition-colors hover:border-bronze hover:text-bronze hover:bg-bronze/10"
                title="Follow us on Instagram"
              >
                <InstagramIcon size={18} />
              </a>

              <a
                href={`https://wa.me/${whatsappDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="rounded-full border border-ivory/20 p-2.5 text-ivory/70 transition-colors hover:border-bronze hover:text-bronze hover:bg-bronze/10"
                title="Chat with us on WhatsApp"
              >
                <MessageCircle size={18} />
              </a>

              <a
                href="mailto:maafurniture.shop@gmail.com"
                aria-label="Email Us"
                className="rounded-full border border-ivory/20 p-2.5 text-ivory/70 transition-colors hover:border-bronze hover:text-bronze hover:bg-bronze/10"
                title="Send us an Email"
              >
                <Mail size={18} />
              </a>
            </div>
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
