import { describe, it, expect } from "vitest";
import {
  consentToggleSchema,
  correctionRequestSchema,
  erasureRequestSchema,
  grievanceSchema,
  publicGrievanceSchema,
} from "./privacy";
import { registerSchema } from "./auth";

describe("consentToggleSchema", () => {
  it("accepts only the two purposes that genuinely run on consent", () => {
    expect(
      consentToggleSchema.safeParse({ purpose: "MARKETING_EMAIL", granted: true })
        .success
    ).toBe(true);
    // Orders, invoices and account creation are contract performance, not
    // consent. Adding them here would create a checkbox a customer could untick
    // and thereby break their own checkout.
    expect(
      consentToggleSchema.safeParse({ purpose: "ORDER_PROCESSING", granted: true })
        .success
    ).toBe(false);
  });
});

describe("erasureRequestSchema", () => {
  const valid = { currentPassword: "hunter2!", confirmation: "DELETE MY DATA" };

  it("accepts the exact confirmation phrase", () => {
    expect(erasureRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects near-misses — this action cannot be undone", () => {
    for (const confirmation of [
      "delete my data",
      "DELETE MY DATA ",
      "DELETE",
      "DELETE  MY  DATA",
      "",
    ]) {
      expect(
        erasureRequestSchema.safeParse({ ...valid, confirmation }).success
      ).toBe(false);
    }
  });

  it("requires the current password, so a stolen cookie is not enough", () => {
    expect(
      erasureRequestSchema.safeParse({ ...valid, currentPassword: "" }).success
    ).toBe(false);
  });
});

describe("grievanceSchema", () => {
  it("requires enough detail to act on and caps the length", () => {
    expect(
      grievanceSchema.safeParse({ category: "OTHER", body: "too short" }).success
    ).toBe(false);
    expect(
      grievanceSchema.safeParse({
        category: "OTHER",
        body: "This is a complaint with enough detail to act on.",
      }).success
    ).toBe(true);
    expect(
      grievanceSchema.safeParse({ category: "OTHER", body: "x".repeat(2001) })
        .success
    ).toBe(false);
  });
});

describe("publicGrievanceSchema", () => {
  it("requires a reply address, because there is no session to reply through", () => {
    const body = "A complaint from someone who cannot sign in to this account.";
    expect(publicGrievanceSchema.safeParse({ category: "OTHER", body }).success).toBe(
      false
    );
    expect(
      publicGrievanceSchema.safeParse({
        category: "OTHER",
        body,
        email: "someone@example.com",
      }).success
    ).toBe(true);
  });
});

describe("correctionRequestSchema", () => {
  it("does not offer name as a correction target", () => {
    // Name is self-service via updateProfile. Routing it through a staff ticket
    // would be a slower path to the same result and imply it is not editable.
    expect(
      correctionRequestSchema.safeParse({
        field: "name",
        detail: "Please change my name to something else.",
      }).success
    ).toBe(false);
  });

  it("accepts the staff-mediated fields", () => {
    expect(
      correctionRequestSchema.safeParse({
        field: "email",
        detail: "My address is misspelt, it should be ramesh@example.com.",
      }).success
    ).toBe(true);
  });
});

describe("registerSchema marketing consent", () => {
  const base = { name: "Ramesh", email: "r@example.com", password: "Passw0rd" };

  it("requires an explicit position rather than defaulting", () => {
    // A `.default(false)` would let a caller omit the field entirely and be
    // accepted. Requiring it means the only way in is to state a position, and
    // the form ships that position as false.
    expect(registerSchema.safeParse(base).success).toBe(false);
    expect(
      registerSchema.safeParse({ ...base, marketingConsent: false }).success
    ).toBe(true);
    expect(
      registerSchema.safeParse({ ...base, marketingConsent: true }).success
    ).toBe(true);
  });

  it("does not coerce a truthy string into consent", () => {
    expect(
      registerSchema.safeParse({ ...base, marketingConsent: "yes" }).success
    ).toBe(false);
  });
});
