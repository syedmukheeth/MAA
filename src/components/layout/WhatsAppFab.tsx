import { WhatsAppIcon } from "@/components/icons/social";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * Desktop-only floating WhatsApp button.
 *
 * `hidden lg:flex` is deliberate: on mobile the tab bar owns the bottom of the
 * screen, and stacking a FAB above it buries the cart tab under a green circle.
 * Mobile users reach WhatsApp from the drawer and the footer contact strip.
 *
 * Renders nothing when the number is unset, rather than the href="#" dead link
 * the footer used to fall back to.
 */
export function WhatsAppFab({ whatsapp }: { whatsapp?: string }) {
  const href = whatsappLink(whatsapp);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="group fixed bottom-8 right-8 z-40 hidden items-center gap-0 overflow-hidden rounded-full bg-espresso py-3.5 pl-4 pr-4 text-ivory shadow-float transition-all duration-500 ease-brand hover:bg-bronze lg:flex"
    >
      <WhatsAppIcon size={19} className="shrink-0" />
      {/* Width, not display: the label has to animate open, and a hidden
          element cannot transition. */}
      <span className="max-w-0 whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-500 ease-brand group-hover:ml-2.5 group-hover:max-w-[9rem] group-hover:opacity-100">
        Chat with us
      </span>
    </a>
  );
}
