import { describe, it, expect } from "vitest";
import { customRequestSchema } from "./custom-request";

describe("Custom Request Schema Validation", () => {
  it("rejects invalid URLs and oversized string inputs", () => {
    // Invalid URL
    const invalidUrl = customRequestSchema.safeParse({
      name: "John",
      phone: "9876543210",
      inspirationUrl: "not-a-url",
    });
    expect(invalidUrl.success).toBe(false);

    // Oversized name (> 100 chars)
    const longName = "A".repeat(101);
    const oversized = customRequestSchema.safeParse({
      name: longName,
      phone: "9876543210",
    });
    expect(oversized.success).toBe(false);
  });

  it("accepts valid custom requests with optional parameters", () => {
    const valid = customRequestSchema.safeParse({
      name: "John Doe",
      phone: "+919876543210",
      inspirationUrl: "https://example.com/chair.jpg",
      wood: "Teak",
      finish: "Natural Gloss",
      budgetRange: "₹20,000 - ₹30,000",
      description: "Custom dining chair set",
    });
    expect(valid.success).toBe(true);
  });
});
