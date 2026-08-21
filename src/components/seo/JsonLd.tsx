/**
 * Structured data (schema.org) for rich results.
 *
 * Rendered as a plain <script type="application/ld+json"> in a server
 * component — crawlers read it straight out of the HTML, so it must not depend
 * on hydration.
 *
 * No nonce, deliberately, even though src/proxy.ts sends
 * `script-src 'self' 'nonce-…' 'strict-dynamic'`. A script element whose type
 * is not a JavaScript type is a *data block*: the HTML spec returns from
 * "prepare the script element" before the CSP check, so script-src never
 * applies. Verified in Chromium against this exact policy — an un-nonced
 * inline JS script was blocked in the same document while this block still
 * parsed fine.
 *
 * Reading the nonce here would mean `headers()`, which opts the product and
 * combo pages out of their `revalidate = 300` static cache — a real cost for
 * no benefit.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The payload is our own server-built object, never user input.
      // JSON.stringify is escaped for `<` so a product description containing
      // "</script>" can't break out of the tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
