import { describe, it, expect } from "vitest";
import {
  anonymisedCustomRequestFields,
  anonymisedOrderFields,
  isErasedUser,
  maskEmail,
  tombstoneUserFields,
} from "./anonymise";

/**
 * These assert the exact field list an erasure writes.
 *
 * The interesting failures are not crashes — they are a future refactor quietly
 * dropping shippingState (which breaks the GST record) or quietly keeping
 * shippingName (which means the erasure did not erase). Both are silent in
 * production and both are caught here.
 */

describe("tombstoneUserFields", () => {
  const fields = tombstoneUserFields("cku123abc", new Date("2026-08-14T00:00:00Z"));

  it("replaces the email with a unique, non-routable address", () => {
    expect(fields.email).toMatch(/^erased-.+@erased\.invalid$/);
    // Derived from the id so the @unique index still holds across many erasures.
    expect(fields.email).toContain("cku123abc");
  });

  it("writes a passwordHash that cannot match any password", () => {
    // Not a bcrypt hash at all — bcrypt.compare returns false for every input.
    // A hash of a random string would leave a credential someone could guess.
    expect(fields.passwordHash).toBe("!erased");
    expect(fields.passwordHash).not.toMatch(/^\$2[aby]\$/);
  });

  it("locks the account and invalidates every issued token", () => {
    expect(fields.isActive).toBe(false);
    expect(fields.tokenVersion).toEqual({ increment: 1 });
  });

  it("marks the row as erased", () => {
    expect(fields.erasedAt).toEqual(new Date("2026-08-14T00:00:00Z"));
    expect(fields.name).toBe("Deleted user");
  });
});

describe("anonymisedOrderFields", () => {
  const fields = anonymisedOrderFields();

  it("removes everything that identifies the recipient", () => {
    expect(fields.shippingName).toBe("[erased]");
    expect(fields.shippingPhone).toBe("[erased]");
    expect(fields.shippingLine1).toBe("[erased]");
    expect(fields.shippingLine2).toBeNull();
    expect(fields.shippingPincode).toBe("000000");
  });

  it("nulls staff free-text that has been seen to contain customer details", () => {
    expect(fields.cancelReason).toBeNull();
    expect(fields.refundNotes).toBeNull();
  });

  it("does NOT touch the GST place of supply or the money", () => {
    // shippingState is the place of supply — removing it makes the invoice
    // non-compliant. shippingCity is retained as the smallest unit supporting a
    // state-level audit. Neither may appear in the update payload at all.
    expect(fields).not.toHaveProperty("shippingState");
    expect(fields).not.toHaveProperty("shippingCity");
    expect(fields).not.toHaveProperty("total");
    expect(fields).not.toHaveProperty("taxAmount");
    expect(fields).not.toHaveProperty("taxRate");
    expect(fields).not.toHaveProperty("orderNumber");
    // Bank/PSP reference — needed to reconcile, not personal data on its own.
    expect(fields).not.toHaveProperty("refundTxnId");
  });
});

describe("anonymisedCustomRequestFields", () => {
  const fields = anonymisedCustomRequestFields();

  it("removes the requester and anything they uploaded or wrote", () => {
    expect(fields.name).toBe("[erased]");
    expect(fields.phone).toBe("[erased]");
    expect(fields.description).toBeNull();
    expect(fields.imageUrl).toBeNull();
    expect(fields.inspirationUrl).toBeNull();
    expect(fields.submittedById).toBeNull();
  });

  it("keeps the build specification", () => {
    // A CONVERTED request describes furniture that exists in someone's house;
    // the spec has a warranty basis even though the identity does not.
    expect(fields).not.toHaveProperty("dimensions");
    expect(fields).not.toHaveProperty("wood");
    expect(fields).not.toHaveProperty("finish");
    expect(fields).not.toHaveProperty("customOptions");
  });
});

describe("isErasedUser", () => {
  it("is false for a live account and true once tombstoned", () => {
    expect(isErasedUser({ erasedAt: null })).toBe(false);
    expect(isErasedUser({ erasedAt: new Date() })).toBe(true);
  });
});

describe("maskEmail", () => {
  it("keeps enough to match a support thread and no more", () => {
    expect(maskEmail("ramesh@gmail.com")).toBe("ra***@gmail.com");
    expect(maskEmail("a@b.com")).toBe("a***@b.com");
    expect(maskEmail("ab@b.com")).toBe("a***@b.com");
  });

  it("does not leak anything for malformed input", () => {
    expect(maskEmail("notanemail")).toBe("***");
    expect(maskEmail("")).toBe("***");
    expect(maskEmail("@nolocal.com")).toBe("***");
  });
});
