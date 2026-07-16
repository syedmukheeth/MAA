"use client";

import { MotionConfig } from "framer-motion";

/**
 * Site-wide reduced-motion compliance (WCAG 2.3.3).
 *
 * `reducedMotion="user"` makes Framer read the OS preference and drop transform
 * and layout animations while still running opacity — which is the correct
 * behaviour, not a shortcut. Content still reveals and state still changes; it
 * simply stops travelling. Stripping animation entirely so elements appear
 * unannounced is a different accessibility problem.
 *
 * This exists because a per-component `useReducedMotion()` is something you have
 * to remember every single time, and MAA shipped with zero of them across
 * eleven animated sections — including an 8-second hero zoom and an infinite
 * loop, the two motions most likely to actually make someone ill. One provider
 * cannot be forgotten.
 *
 * CSS keyframes are outside Framer's reach; globals.css covers those.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
