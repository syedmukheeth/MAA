"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

/**
 * Counts up to `value` once it scrolls into view. Framer's `useSpring` drives
 * the interpolation so the count settles rather than ticking linearly — a
 * flat linear count reads as a loading spinner, not a stat.
 *
 * Renders the final value in plain text if JS hasn't hydrated yet, so there is
 * no "0" flash and nothing to reflow once it does.
 */
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toLocaleString("en-IN"),
  suffix = "",
  className,
}: {
  value: number;
  format?: (n: number) => string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { damping: 24, stiffness: 70 });
  // MotionConfig's reducedMotion="user" only governs declarative
  // animate/whileInView props; this is an imperative useSpring, so it needs
  // its own check to honour the same preference.
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      if (ref.current) ref.current.textContent = format(value) + suffix;
      return;
    }
    motionValue.set(value);
  }, [inView, value, motionValue, reduceMotion, format, suffix]);

  useEffect(() => {
    if (reduceMotion) return;
    const unsubscribe = spring.on("change", (latest) => {
      if (ref.current) ref.current.textContent = format(latest) + suffix;
    });
    return unsubscribe;
  }, [spring, format, suffix, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {format(value)}
      {suffix}
    </span>
  );
}
