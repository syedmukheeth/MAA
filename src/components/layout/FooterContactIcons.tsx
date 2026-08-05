"use client";

import { Phone, Mail, MessageCircle, MapPin } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

export function FooterContactIcons({
  instagramUrl,
  whatsappDigits,
}: {
  instagramUrl?: string | null;
  whatsappDigits: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      {/* Phone Icon with Popover for 2 Phone Numbers */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Call MAA Furniture"
            title="Call Us (Select Number)"
            className="rounded-full border border-ivory/20 p-2.5 text-ivory/70 transition-all hover:border-bronze hover:text-bronze hover:bg-bronze/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze"
          >
            <Phone size={18} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="start"
          className="dark w-52 border border-bronze/40 bg-charcoal p-2.5 text-ivory shadow-xl rounded-xl"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-bronze px-2.5 py-1">
            Call MAA Furniture
          </p>
          <div className="mt-1 space-y-1">
            <a
              href="tel:8886995345"
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-ivory hover:bg-bronze/20 hover:text-bronze transition-colors"
            >
              <Phone size={14} className="text-bronze shrink-0" />
              <span>8886995345</span>
            </a>
            <a
              href="tel:9912330151"
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-ivory hover:bg-bronze/20 hover:text-bronze transition-colors"
            >
              <Phone size={14} className="text-bronze shrink-0" />
              <span>9912330151</span>
            </a>
          </div>
        </PopoverContent>
      </Popover>

      {/* WhatsApp Icon */}
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

      {/* Email Icon */}
      <a
        href="mailto:maafurniture.shop@gmail.com"
        aria-label="Email Us"
        title="Send an Email (maafurniture.shop@gmail.com)"
        className="rounded-full border border-ivory/20 p-2.5 text-ivory/70 transition-colors hover:border-bronze hover:text-bronze hover:bg-bronze/10"
      >
        <Mail size={18} />
      </a>

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
      <a
        href="/showroom"
        aria-label="Showroom Location"
        title="Showroom Location — Kurnool, AP"
        className="rounded-full border border-ivory/20 p-2.5 text-ivory/70 transition-colors hover:border-bronze hover:text-bronze hover:bg-bronze/10"
      >
        <MapPin size={18} />
      </a>
    </div>
  );
}
