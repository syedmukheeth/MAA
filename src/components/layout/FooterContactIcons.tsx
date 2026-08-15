"use client";

import { useState, useRef, useEffect } from "react";
import { Phone, Mail, MessageCircle, MapPin } from "lucide-react";

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

/**
 * Every channel here comes from SiteSettings. The phone numbers, the email and
 * the Maps link used to be literals in this file, so changing a phone number
 * meant a code change and a deploy — and the values drifted out of step with the
 * same details rendered from the database elsewhere on the page.
 */
export function FooterContactIcons({
  instagramUrl,
  whatsappDigits,
  phones,
  email,
  mapsUrl,
}: {
  instagramUrl?: string | null;
  whatsappDigits: string;
  /** Comma-separated, as stored in SiteSettings.showroomPhone. */
  phones: string;
  email?: string | null;
  mapsUrl?: string | null;
}) {
  const phoneList = phones
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const [phoneMenuOpen, setPhoneMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setPhoneMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      {/* Phone icon with a dropdown, one entry per number in SiteSettings. */}
      {phoneList.length > 0 && (
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setPhoneMenuOpen((prev) => !prev)}
          aria-label="Call MAA Furniture"
          aria-expanded={phoneMenuOpen}
          title="Call Us (Select Number)"
          className="rounded-full border border-ivory/20 p-2.5 text-ivory/70 transition-all hover:border-bronze hover:text-bronze hover:bg-bronze/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze cursor-pointer"
        >
          <Phone size={18} />
        </button>

        {phoneMenuOpen && (
          <div className="absolute bottom-full left-0 mb-2.5 w-52 rounded-xl border border-bronze/40 bg-charcoal p-2.5 text-ivory shadow-2xl z-50">
            <p className="text-[10px] font-bold uppercase tracking-wider text-bronze px-2.5 py-1">
              Call MAA Furniture
            </p>
            <div className="mt-1 space-y-1">
              {phoneList.map((number) => (
                <a
                  key={number}
                  href={`tel:${number.replace(/[^0-9+]/g, "")}`}
                  onClick={() => setPhoneMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-ivory hover:bg-bronze/20 hover:text-bronze transition-colors"
                >
                  <Phone size={14} className="text-bronze shrink-0" />
                  <span>{number}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* WhatsApp Icon */}
      {whatsappDigits && (
      <a
        href={`https://wa.me/${whatsappDigits}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        title="Chat on WhatsApp"
        className="rounded-full border border-ivory/20 p-2.5 text-ivory/70 transition-colors hover:border-bronze hover:text-bronze hover:bg-bronze/10"
      >
        <MessageCircle size={18} />
      </a>
      )}

      {/* Email Icon */}
      {email && (
        <a
          href={`mailto:${email}`}
          aria-label="Email Us"
          title={`Send an Email (${email})`}
          className="rounded-full border border-ivory/20 p-2.5 text-ivory/70 transition-colors hover:border-bronze hover:text-bronze hover:bg-bronze/10"
        >
          <Mail size={18} />
        </a>
      )}

      {/* Instagram Icon */}
      <a
        href={instagramUrl || "https://instagram.com"}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        title="Follow on Instagram"
        className="rounded-full border border-ivory/20 p-2.5 text-ivory/70 transition-colors hover:border-bronze hover:text-bronze hover:bg-bronze/10"
      >
        <InstagramIcon size={18} />
      </a>

      {/* Location / Map Pin Icon */}
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open MAA Furniture Google Maps Location"
          title="Open MAA Furniture Showroom Location in Google Maps"
          className="rounded-full border border-ivory/20 p-2.5 text-ivory/70 transition-colors hover:border-bronze hover:text-bronze hover:bg-bronze/10"
        >
          <MapPin size={18} />
        </a>
      )}
    </div>
  );
}
