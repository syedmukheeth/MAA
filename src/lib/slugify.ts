/**
 * Turn a free-form name ("Royal Teak Sofa!") into a URL slug
 * ("royal-teak-sofa") that satisfies the lowercase slug regex in validations.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}
