import { describe, it, expect } from "vitest";
import { resolveCurrentConsents, isGranted } from "./consent";

/**
 * The ConsentRecord table is append-only, so "does this person consent?" is
 * always a question about which row landed last. Getting that wrong in either
 * direction is serious: reading a stale GRANTED means emailing someone who
 * opted out, and defaulting to granted when there is no record at all means
 * claiming consent that was never given.
 */

function record(
  purpose: "MARKETING_EMAIL" | "TESTIMONIAL_PUBLICATION",
  status: "GRANTED" | "WITHDRAWN",
  iso: string
) {
  return { purpose, status, grantedAt: new Date(iso) } as const;
}

describe("resolveCurrentConsents", () => {
  it("returns the newest record per purpose regardless of input order", () => {
    const current = resolveCurrentConsents([
      record("MARKETING_EMAIL", "WITHDRAWN", "2026-03-01"),
      record("MARKETING_EMAIL", "GRANTED", "2026-01-01"),
      record("MARKETING_EMAIL", "GRANTED", "2026-02-01"),
    ]);
    expect(current.MARKETING_EMAIL?.status).toBe("WITHDRAWN");
  });

  it("tracks each purpose independently", () => {
    const current = resolveCurrentConsents([
      record("MARKETING_EMAIL", "GRANTED", "2026-01-01"),
      record("TESTIMONIAL_PUBLICATION", "WITHDRAWN", "2026-02-01"),
    ]);
    expect(current.MARKETING_EMAIL?.status).toBe("GRANTED");
    expect(current.TESTIMONIAL_PUBLICATION?.status).toBe("WITHDRAWN");
  });

  it("returns nothing for a purpose that was never recorded", () => {
    const current = resolveCurrentConsents([
      record("MARKETING_EMAIL", "GRANTED", "2026-01-01"),
    ]);
    expect(current.TESTIMONIAL_PUBLICATION).toBeUndefined();
  });
});

describe("isGranted", () => {
  it("is false when there is no record at all", () => {
    // The critical case. registerAction writes NOTHING when the box is left
    // unticked, so "no row" is the normal representation of "never agreed" —
    // it must never be read as consent.
    expect(isGranted([], "MARKETING_EMAIL")).toBe(false);
  });

  it("is false when the newest record is a withdrawal", () => {
    expect(
      isGranted(
        [
          record("MARKETING_EMAIL", "GRANTED", "2026-01-01"),
          record("MARKETING_EMAIL", "WITHDRAWN", "2026-02-01"),
        ],
        "MARKETING_EMAIL"
      )
    ).toBe(false);
  });

  it("is true again after re-granting following a withdrawal", () => {
    expect(
      isGranted(
        [
          record("MARKETING_EMAIL", "GRANTED", "2026-01-01"),
          record("MARKETING_EMAIL", "WITHDRAWN", "2026-02-01"),
          record("MARKETING_EMAIL", "GRANTED", "2026-03-01"),
        ],
        "MARKETING_EMAIL"
      )
    ).toBe(true);
  });

  it("does not let one purpose's consent answer for another", () => {
    expect(
      isGranted(
        [record("MARKETING_EMAIL", "GRANTED", "2026-01-01")],
        "TESTIMONIAL_PUBLICATION"
      )
    ).toBe(false);
  });
});
