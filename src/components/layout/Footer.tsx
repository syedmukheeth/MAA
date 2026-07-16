import Link from "next/link";
import Image from "next/image";
import { AtSign, Globe, MessageCircle } from "lucide-react";

const COLUMNS = [
  {
    title: "Collections",
    links: [
      { label: "Living Room", href: "/products?category=LIVING_ROOM" },
      { label: "Bedroom", href: "/products?category=BEDROOM" },
      { label: "Dining", href: "/products?category=DINING" },
      { label: "Office", href: "/products?category=OFFICE" },
      { label: "Outdoor", href: "/products?category=OUTDOOR" },
    ],
  },
  {
    title: "Studio",
    links: [
      { label: "Custom Furniture", href: "/#custom-studio" },
      { label: "Combo Offers", href: "/combos" },
      { label: "Materials", href: "/#materials" },
      { label: "Room Inspirations", href: "/#room-inspirations" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our Story", href: "/#craftsmanship" },
      { label: "Showroom", href: "/#showroom" },
      { label: "Reviews", href: "/#testimonials" },
      { label: "All Products", href: "/products" },
    ],
  },
];

export function Footer({
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

  return (
    <footer className="bg-charcoal text-ivory">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/brand/logo.jpeg"
                alt="MAA FURNITURE"
                width={48}
                height={48}
                className="rounded-full"
              />
              <span className="font-heading text-xl">MAA FURNITURE</span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ivory/60">
              Handcrafted furniture designed to bring timeless beauty and
              lasting comfort into every home, built to be lived in for
              generations.
              {deliveryMessage ? ` ${deliveryMessage}.` : ""}
            </p>
            <div className="mt-6 flex gap-4">
              <a
                href={instagramUrl || "#"}
                target={instagramUrl ? "_blank" : undefined}
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="rounded-full border border-ivory/20 p-2.5 transition-colors hover:border-bronze hover:text-bronze"
              >
                <AtSign size={18} />
              </a>
              <a
                href={facebookUrl || "#"}
                target={facebookUrl ? "_blank" : undefined}
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="rounded-full border border-ivory/20 p-2.5 transition-colors hover:border-bronze hover:text-bronze"
              >
                <Globe size={18} />
              </a>
              <a
                href={whatsappDigits ? `https://wa.me/${whatsappDigits}` : "#"}
                target={whatsappDigits ? "_blank" : undefined}
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="rounded-full border border-ivory/20 p-2.5 transition-colors hover:border-bronze hover:text-bronze"
              >
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="font-heading text-sm uppercase tracking-widest text-bronze">
                {col.title}
              </h4>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ivory/70 transition-colors hover:text-ivory"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-ivory/10 pt-8 text-xs text-ivory/50 lg:flex-row">
          <p>&copy; {new Date().getFullYear()} MAA FURNITURE. All rights reserved.</p>
          <p>Crafted with care, by Sampeer Studio.</p>
        </div>
      </div>
    </footer>
  );
}
