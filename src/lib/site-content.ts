/**
 * The homepage content blocks the owner edits at /admin/settings.
 *
 * Each one used to be a hardcoded array inside its component, asserting things
 * only the business can assert — a five-year warranty, a three-to-six week lead
 * time. They are stored as JSON strings on SiteSettings and parsed here.
 *
 * The parsers return an empty array for null, malformed JSON, or entries missing
 * their required fields, and every consumer renders nothing for an empty array.
 * That is deliberate: a missing section is a correct site, while a section
 * making a promise nobody made is the shop's liability.
 *
 * No `@/lib/db` import, so client components can use these without pulling `pg`
 * into the browser bundle.
 */

export type TrustBadge = { title: string; body: string };
export type FaqItem = { question: string; answer: string };

function parseArray(raw: string | null | undefined): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Same posture as cleanJson in site-settings.ts: corrupt content is dropped,
    // never thrown, or one bad character in a settings field takes down the
    // homepage.
    console.warn("Corrupted JSON in site content ignored");
    return [];
  }
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseTrustBadges(raw: string | null | undefined): TrustBadge[] {
  return parseArray(raw)
    .map((item) => {
      const row = item as Record<string, unknown>;
      return { title: str(row?.title), body: str(row?.body) };
    })
    .filter((b) => b.title !== "");
}

export function parseFaqItems(raw: string | null | undefined): FaqItem[] {
  return parseArray(raw)
    .map((item) => {
      const row = item as Record<string, unknown>;
      return { question: str(row?.question), answer: str(row?.answer) };
    })
    .filter((f) => f.question !== "" && f.answer !== "");
}
