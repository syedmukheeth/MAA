import Image from "next/image";

/**
 * The brand lockup. Previously hand-rolled three times — Navbar at 40px with a
 * bronze/20 ring, Footer at 48px with none, the auth layout at 44px — so the
 * mark was a different object on every screen.
 *
 * `tone` exists because the navbar renders this over the hero image, where the
 * wordmark must be ivory, and over its own ivory glass, where it must be
 * charcoal. It is not a dark-mode concern; the storefront is light-locked.
 */

const SIZES = {
  sm: { px: 36, wordmark: "text-base" },
  md: { px: 42, wordmark: "text-lg" },
  lg: { px: 52, wordmark: "text-xl sm:text-2xl" },
} as const;

export function BrandMark({
  size = "md",
  tone = "dark",
  showWordmark = true,
  className = "",
}: {
  size?: keyof typeof SIZES;
  /** `dark` = charcoal type for light surfaces, `light` = ivory type for dark. */
  tone?: "dark" | "light";
  showWordmark?: boolean;
  className?: string;
}) {
  const { px, wordmark } = SIZES[size];

  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/brand/logo.jpeg"
        alt="MAA FURNITURE"
        width={px}
        height={px}
        priority
        style={{ width: px, height: px }}
        className="shrink-0 rounded-full ring-1 ring-bronze/25 transition-transform duration-500 ease-brand group-hover:scale-105"
      />
      {showWordmark && (
        <span
          className={`font-heading ${wordmark} leading-none tracking-[0.06em] transition-colors duration-300 ${
            tone === "light" ? "text-ivory" : "text-charcoal"
          }`}
        >
          MAA FURNITURE
        </span>
      )}
    </span>
  );
}
