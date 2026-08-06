import type { Transition, Variants } from "framer-motion";

/**
 * Shared motion language.
 *
 * Before this file, every section component inlined its own `duration` and
 * `delay` numbers — 0.8/0.9/0.6 with `easeOut` — so nothing on the page moved
 * on the same clock. Import from here instead of typing a number.
 *
 * Reduced motion is handled globally by <MotionConfig reducedMotion="user">
 * in MotionProvider, so these values need no branch of their own.
 */

/** Decelerating curve — fast start, long settle. The house easing. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** For elements leaving or collapsing, where a long settle reads as lag. */
export const EASE_IN_OUT = [0.4, 0, 0.2, 1] as const;

export const DUR = {
  /** Hovers, icon swaps, badge pops. */
  fast: 0.25,
  /** The default for anything entering the viewport. */
  base: 0.5,
  /** Hero headline, mega-menu panel — deliberately unhurried. */
  slow: 0.8,
} as const;

/** Gap between siblings in a staggered reveal. */
export const STAGGER = 0.07;

export const easeOut: Transition = {
  duration: DUR.base,
  ease: EASE_OUT_EXPO,
};

/** Rise-and-fade. `custom` is the stagger index. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DUR.slow, ease: EASE_OUT_EXPO, delay: i * STAGGER },
  }),
};

/**
 * Type reveal: the line slides up from behind its own bottom edge rather than
 * fading in place. Requires the parent to clip — `overflow-hidden` on a wrapper
 * per line — which is why headline lines each get their own span.
 */
export const revealMask: Variants = {
  hidden: { y: "110%" },
  visible: (i = 0) => ({
    y: "0%",
    transition: { duration: DUR.slow, ease: EASE_OUT_EXPO, delay: 0.15 + i * 0.1 },
  }),
};

/** Container that hands `visible` down to children on its own schedule. */
export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER } },
};
