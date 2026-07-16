/**
 * MOTION SYSTEM — one dialect for the whole site.
 *
 * Every reveal, stagger, and transition pulls from here so the page moves like
 * one organism, not eleven sections that each invented their own timing. A
 * component with a literal `duration: 0.6` has silently left the system, and
 * nothing will tell you.
 *
 * Reduced motion is handled globally by <MotionConfig reducedMotion="user">
 * in MotionProvider — Framer then drops transform/layout animations and keeps
 * opacity, which is the correct behaviour: state still changes and content
 * still reveals, it just stops travelling. Anything NOT driven by Framer
 * (CSS keyframes) is covered by the @media block in globals.css.
 */

/** Systemic z-index scale. Never spray arbitrary z values in components. */
export const Z = {
  base: 0,
  raised: 10,
  nav: 40,
  overlay: 50,
} as const;

/**
 * Easing. Three curves, three jobs. A fourth needs a reason you can say out
 * loud — "it felt nice" is how per-section timing comes back.
 */
export const EASE = {
  /** expo-out — the default "arrive and settle" curve */
  out: [0.16, 1, 0.3, 1],
  /** smooth symmetric — for scrub / camera-like moves */
  inOut: [0.65, 0, 0.35, 1],
  /** soft overshoot — for accents that pop once */
  pop: [0.34, 1.4, 0.64, 1],
} as const;

export const DUR = {
  fast: 0.45,
  base: 0.7,
  slow: 1.0,
  hero: 0.85,
} as const;

/** Reveal cadence — shared so staggers read as one rhythm everywhere. */
export const STAGGER = {
  tight: 0.06,
  base: 0.09,
  loose: 0.14,
} as const;

/** Default in-view trigger — reveal a touch before fully on screen. */
export const VIEWPORT = { once: true, amount: 0.25 } as const;

/** The signature lift distance for fade-up reveals (px). One value, site-wide. */
export const RISE = 28;

/**
 * Standard fade-up reveal. Use instead of hand-rolling initial/whileInView.
 *
 *   <motion.div {...fadeUp()} />
 *   <motion.div {...fadeUp(0.1)} />   // small lead-in
 *
 * No reduced-motion branch needed here — MotionConfig strips the `y` globally.
 */
export function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: RISE },
    whileInView: { opacity: 1, y: 0 },
    viewport: VIEWPORT,
    transition: { duration: DUR.base, ease: EASE.out, delay },
  } as const;
}

/** Stagger container; children use `staggerItem`. Replaces hand-built delay ladders. */
export const staggerContainer = {
  initial: "hidden",
  whileInView: "show",
  viewport: VIEWPORT,
  variants: {
    hidden: {},
    show: { transition: { staggerChildren: STAGGER.base } },
  },
} as const;

export const staggerItem = {
  variants: {
    hidden: { opacity: 0, y: RISE },
    show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE.out } },
  },
} as const;
