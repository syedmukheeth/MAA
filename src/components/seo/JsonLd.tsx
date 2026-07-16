/**
 * Structured data (schema.org) for rich results.
 *
 * Rendered as a plain <script type="application/ld+json"> in a server
 * component — crawlers read it straight out of the HTML, so it must not depend
 * on hydration.
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
