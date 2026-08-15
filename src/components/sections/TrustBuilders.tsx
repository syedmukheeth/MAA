"use client";

import { motion } from "framer-motion";
import { parseTrustBadges } from "@/lib/site-content";

/**
 * Stats and trust claims, all owner-supplied.
 *
 * Nothing here has a default. The stats hide individually when unset (0 or an
 * empty string), and the claims block disappears until the owner writes their
 * own — the four that used to ship, including a five-year warranty "in writing",
 * were design copy for a business that had never agreed to them.
 */
export function TrustBuilders({
  yearsExperience,
  projectsDelivered,
  happyFamilies,
  googleRating,
  trustBadges,
}: {
  yearsExperience: number;
  projectsDelivered: number;
  happyFamilies: number;
  googleRating: string;
  trustBadges?: string | null;
}) {
  const stats = [
    yearsExperience > 0
      ? { label: "Years of Experience", value: `${yearsExperience}+` }
      : null,
    projectsDelivered > 0
      ? {
          label: "Projects Delivered",
          value: `${projectsDelivered.toLocaleString("en-IN")}+`,
        }
      : null,
    happyFamilies > 0
      ? {
          label: "Happy Families",
          value: `${happyFamilies.toLocaleString("en-IN")}+`,
        }
      : null,
    googleRating.trim() !== ""
      ? { label: "Google Rating", value: googleRating }
      : null,
  ].filter((s): s is { label: string; value: string } => s !== null);

  const badges = parseTrustBadges(trustBadges);

  // Both halves empty means the whole dark band is an empty box on the page.
  if (stats.length === 0 && badges.length === 0) return null;

  return (
    <section className="bg-charcoal px-6 py-20 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-7xl">
        {stats.length > 0 && (
          <div className="mb-12 grid grid-cols-2 gap-8 border-b border-ivory/10 pb-10 sm:mb-16 sm:pb-14 lg:mb-20 lg:grid-cols-4 lg:pb-16">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="text-center lg:text-left"
              >
                <p className="font-heading text-4xl text-bronze sm:text-5xl">
                  {s.value}
                </p>
                <p className="mt-2 text-sm text-ivory/60">{s.label}</p>
              </motion.div>
            ))}
          </div>
        )}

        {badges.length > 0 && (
          <>
            <div className="mb-16 max-w-2xl">
              <p className="text-xs uppercase tracking-[0.35em] text-bronze">
                Why Choose Us
              </p>
              <h2 className="mt-5 font-heading text-3xl text-ivory sm:text-4xl">
                Trust, built into every joint.
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {badges.map((badge, i) => (
                <motion.div
                  key={`${badge.title}-${i}`}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                >
                  <h3 className="font-heading text-lg text-ivory">
                    {badge.title}
                  </h3>
                  {badge.body && (
                    <p className="mt-2 text-sm leading-relaxed text-ivory/60">
                      {badge.body}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
