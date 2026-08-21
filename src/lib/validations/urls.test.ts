import { describe, it, expect } from "vitest";
import { isHttpsUrl, cloudinaryImageUrl } from "./urls";
import { testimonialSchema } from "./testimonial";

describe("shared URL predicates", () => {
  it("treats blank as valid — every field using these is optional", () => {
    for (const blank of ["", null, undefined]) {
      expect(isHttpsUrl(blank)).toBe(true);
      expect(cloudinaryImageUrl(blank)).toBe(true);
    }
  });

  it("rejects javascript: and plain http", () => {
    expect(isHttpsUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpsUrl("http://example.com")).toBe(false);
    expect(isHttpsUrl("https://example.com")).toBe(true);
  });

  it("pins images to res.cloudinary.com, the only host next.config.ts allows", () => {
    expect(cloudinaryImageUrl("https://res.cloudinary.com/demo/image/upload/a.jpg")).toBe(true);
    expect(cloudinaryImageUrl("https://evil.example.com/a.jpg")).toBe(false);
    // Substring, not the host — a naive includes() check would pass this.
    expect(cloudinaryImageUrl("https://res.cloudinary.com.evil.test/a.jpg")).toBe(false);
  });
});

describe("testimonial imageUrl", () => {
  const base = { name: "Ravi", quote: "Beautiful teak dining table, well built." };

  it("accepts a Cloudinary upload and a blank field", () => {
    expect(
      testimonialSchema.safeParse({
        ...base,
        imageUrl: "https://res.cloudinary.com/demo/image/upload/v1/r.jpg",
      }).success
    ).toBe(true);
    expect(testimonialSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a foreign host, which used to save and then throw in next/image", () => {
    expect(
      testimonialSchema.safeParse({ ...base, imageUrl: "https://i.imgur.com/x.jpg" }).success
    ).toBe(false);
  });
});
