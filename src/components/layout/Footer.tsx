import Link from "next/link";
import { ArrowUp, Clock, MapPin, Phone } from "lucide-react";
import { hasPublishedTestimonials } from "@/lib/testimonials";
import { BrandMark } from "@/components/layout/BrandMark";
import { InstagramIcon, FacebookIcon, WhatsAppIcon } from "@/components/icons/social";
import { CATEGORY_LABELS, ROOM_CATEGORIES } from "@/lib/validations/product";
import { whatsappLink } from "@/lib/whatsapp";

type FooterLink = { label: string; href: string };

/** Built from the canonical enum so the footer can't advertise a category the
 *  shop no longer labels the same way. */
const COLLECTION_LINKS: FooterLink[] = ROOM_CATEGORIES.map((key) => ({
  label: CATEGORY_LABELS[key],
  href: `/products?category=${key}`,
}));

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  { title: "Collections", links: COLLECTION_LINKS },
  {
    title: "Studio",
    links: [
      { label: "Custom Furniture", href: "/custom-studio" },
      { label: "Combo Offers", href: "/combos" },
      { label: "Room Inspirations", href: "/showroom" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our Story", href: "/#about" },
      { label: "Showroom", href: "/showroom" },
      { label: "All Products", href: "/products" },
    ],
  },
];

export async function Footer({
  instagramUrl,
  facebookUrl,
  whatsapp,
  phone,
  address,
  hours,
  deliveryMessage,
}: {
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  whatsapp?: string;
  phone?: string;
  address?: string;
  hours?: string;
  deliveryMessage?: string;
}) {
  const whatsappHref = whatsappLink(whatsapp);
  // showroomPhone is a comma-separated list in site settings — previously the
  // footer ignored it entirely and hardcoded two numbers, so admin edits did
  // nothing.
  const phoneNumbers = (phone ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  // "Reviews" jumps to #testimonials, which only exists when something is
  // published — see hasPublishedTestimonials().
  const showReviews = await hasPublishedTestimonials();
  const columns = COLUMNS.map((col) =>
    col.title === "Company" && showReviews
      ? {
          ...col,
          links: [
            ...col.links.slice(0, 2),
            { label: "Reviews", href: "/#testimonials" },
            ...col.links.slice(2),
          ],
        }
      : col
  );

  return (
    // pb-16 on mobile reserves the height of the fixed MobileTabBar — the
    // footer is the last thing on every page, so it is what the bar would cover.
    <footer className="relative overflow-hidden bg-espresso pb-16 text-ivory lg:pb-0">
      <div className="surface-grain" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-bronze/60 to-transparent" />

      {/* Contact strip. The showroom address, phone and WhatsApp used to be
          11px text buried in the brand column; they are the highest-intent
          links in the footer, so they lead it. */}
      <div className="relative border-b border-ivory/10">
        <div className="mx-auto grid max-w-7xl gap-px px-6 sm:grid-cols-3 lg:px-10">
          {address && (
            <ContactCell
              icon={<MapPin size={16} />}
              title="Visit the showroom"
              body={address}
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
              external
            />
          )}
          {phoneNumbers.length > 0 && (
            // Not a ContactCell: settings can hold several numbers, and each
            // needs its own tel: link — one anchor cannot contain others.
            <div className="group flex gap-4 px-1 py-7 sm:px-5">
              <span className="mt-0.5 shrink-0 text-gold">
                <Phone size={16} />
              </span>
              <span>
                <span className="block text-[0.65rem] font-medium uppercase tracking-eyebrow text-ivory/50">
                  Call us
                </span>
                <span className="mt-1.5 flex flex-col gap-1">
                  {phoneNumbers.map((num) => (
                    <a
                      key={num}
                      href={`tel:${num.replace(/[^0-9+]/g, "")}`}
                      className="link-underline w-fit text-sm text-ivory/85 hover:text-ivory"
                    >
                      {num}
                    </a>
                  ))}
                </span>
              </span>
            </div>
          )}
          {whatsappHref && (
            <ContactCell
              icon={<WhatsAppIcon size={16} />}
              title="WhatsApp us"
              body={hours ?? "Send photos of your space for a quote"}
              href={whatsappHref}
              external
            />
          )}
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-14 sm:py-16 lg:px-10 lg:py-20">
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:gap-14">
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href="/" className="group inline-block" aria-label="MAA FURNITURE — home">
              <BrandMark size="md" tone="light" />
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ivory/60">
              Handcrafted furniture designed to bring timeless beauty and
              lasting comfort into every home, built to be lived in for
              generations.
              {deliveryMessage ? ` ${deliveryMessage}.` : ""}
            </p>
            {hours && (
              <p className="mt-5 flex items-start gap-2.5 text-xs text-ivory/50">
                <Clock size={13} className="mt-0.5 shrink-0 text-gold" />
                {hours}
              </p>
            )}
            <div className="mt-7 flex gap-3">
              {instagramUrl && (
                <SocialLink href={instagramUrl} label="Instagram">
                  <InstagramIcon size={17} />
                </SocialLink>
              )}
              {facebookUrl && (
                <SocialLink href={facebookUrl} label="Facebook">
                  <FacebookIcon size={17} />
                </SocialLink>
              )}
              {whatsappHref && (
                <SocialLink href={whatsappHref} label="WhatsApp">
                  <WhatsAppIcon size={17} />
                </SocialLink>
              )}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-[0.65rem] font-medium uppercase tracking-eyebrow text-gold">
                {col.title}
              </h4>
              <ul className="mt-5 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="link-underline text-sm text-ivory/65 transition-colors hover:text-ivory"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ivory/10 pt-8 text-center text-xs text-ivory/60 sm:mt-16 lg:flex-row lg:text-left">
          <p>&copy; {new Date().getFullYear()} MAA FURNITURE. All rights reserved.</p>
          <p className="order-last lg:order-none">
            Handcrafted in Kurnool · Crafted with care, by Sampeer Studio.
          </p>
          <a
            href="#top"
            className="inline-flex items-center gap-1.5 text-ivory/60 transition-colors hover:text-gold"
          >
            Back to top
            <ArrowUp size={13} />
          </a>
        </div>
      </div>
    </footer>
  );
}

function ContactCell({
  icon,
  title,
  body,
  href,
  external = false,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="group flex gap-4 px-1 py-7 transition-colors duration-500 ease-brand hover:bg-ivory/5 sm:px-5"
    >
      <span className="mt-0.5 shrink-0 text-gold transition-transform duration-500 ease-brand group-hover:-translate-y-0.5">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.65rem] font-medium uppercase tracking-eyebrow text-ivory/50">
          {title}
        </span>
        <span className="mt-1.5 block text-sm leading-relaxed text-ivory/85">{body}</span>
      </span>
    </a>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="rounded-full border border-ivory/20 p-2.5 text-ivory/80 transition-colors duration-300 ease-brand hover:border-bronze hover:bg-bronze hover:text-ivory"
    >
      {children}
    </a>
  );
}
