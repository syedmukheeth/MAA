"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

/**
 * Counts a stat up from zero when it scrolls into view.
 *
 * Takes the finished display string ("4,200+", "4.9/5", "18+") rather than a
 * number and a pile of formatting props: the surrounding component already
 * decides how each figure reads, and splitting that decision across two files
 * is how the "+" ends up in the wrong place.
 *
 * The leading number is animated; whatever sits either side of it is held
 * fixed. Grouping and decimal places are copied from the target, so 4,200
 * counts in whole thousands with Indian grouping and 4.9 counts in tenths —
 * neither ever renders as 4200 or 4.90 mid-flight.
 */
export function CountUp({
  value,
  durationMs = 1600,
  className,
}: {
  value: string;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  // once: a number that re-counts every time it scrolls past is a distraction,
  // not a flourish.
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduceMotion = useReducedMotion();

  const [display, setDisplay] = useState<string | null>(null);

  /**
   * Memoised, and the effect below depends on the primitives it yields rather
   * than on this object.
   *
   * `value.match()` returns a new array on every render. Listing that array as
   * an effect dependency means each setDisplay re-render counts as a dependency
   * change: the effect tears down, cancels its frame and restarts its clock
   * from the current instant. Progress resets to zero every frame and the
   * number never leaves the starting value.
   */
  const parsed = useMemo(() => {
    const match = value.match(/^(\D*)([\d,]+(?:\.\d+)?)(.*)$/);
    if (!match) return null;
    const digits = match[2];
    return {
      prefix: match[1],
      suffix: match[3],
      target: Number(digits.replace(/,/g, "")),
      decimals: digits.includes(".") ? (digits.split(".")[1]?.length ?? 0) : 0,
      grouped: digits.includes(","),
    };
  }, [value]);

  const target = parsed?.target ?? NaN;
  const decimals = parsed?.decimals ?? 0;
  const grouped = parsed?.grouped ?? false;

  useEffect(() => {
    // Reduced motion is a stated accessibility preference, and a number
    // sprinting to its value is exactly the kind of movement it asks to avoid.
    if (Number.isNaN(target) || reduceMotion || !inView) return;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      // easeOutExpo: most of the distance is covered early, then it settles.
      // Linear counting reads like a loading spinner rather than a reveal.
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const current = target * eased;

      setDisplay(
        current.toLocaleString(grouped ? "en-IN" : "en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
          useGrouping: grouped,
        })
      );

      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target, durationMs, decimals, grouped, reduceMotion]);

  // Unparseable, reduced motion, or not yet in view: the real value, verbatim.
  // Server render and no-JS land here too, so the figure is always present —
  // the animation is decoration, never the only way the number appears.
  const body =
    parsed && display !== null
      ? `${parsed.prefix}${display}${parsed.suffix}`
      : value;

  return (
    <p ref={ref} className={className}>
      {body}
    </p>
  );
}
