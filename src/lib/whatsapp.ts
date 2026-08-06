/**
 * wa.me links need a full international number. `SiteSettings.showroomWhatsapp`
 * is stored the way the showroom writes it — "8886995345", ten local digits —
 * so linking it verbatim produces a wa.me URL WhatsApp cannot resolve.
 *
 * Returns null when there is nothing usable, so callers render no link rather
 * than the href="#" dead end the footer used to fall back to.
 */
const INDIA_CC = "91";

export function whatsappLink(raw?: string | null): string | null {
  const digits = (raw ?? "").replace(/[^0-9]/g, "");
  if (!digits) return null;
  // 10 digits = a bare Indian mobile number. Anything longer already carries a
  // country code (or is a number we should not second-guess).
  const full = digits.length === 10 ? `${INDIA_CC}${digits}` : digits;
  return `https://wa.me/${full}`;
}
