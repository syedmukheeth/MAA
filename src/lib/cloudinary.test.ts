import { describe, it, expect } from "vitest";
import { parsePublicId } from "./cloudinary";

/**
 * Erasing a customer's uploaded photo depends entirely on recovering the right
 * public_id from the stored delivery URL. Get it wrong and destroy() silently
 * returns "not found" — the database says the image is gone while the file is
 * still served from Cloudinary's CDN to anyone holding the old link.
 */

describe("parsePublicId", () => {
  it("strips the version segment and the extension", () => {
    expect(
      parsePublicId(
        "https://res.cloudinary.com/demo/image/upload/v1700000000/maa-furniture/custom-requests/abc123.jpg"
      )
    ).toBe("maa-furniture/custom-requests/abc123");
  });

  it("keeps the folder path, which is part of the id", () => {
    expect(
      parsePublicId(
        "https://res.cloudinary.com/demo/image/upload/v1/a/b/c/name.webp"
      )
    ).toBe("a/b/c/name");
  });

  it("handles a URL with no version segment", () => {
    expect(
      parsePublicId("https://res.cloudinary.com/demo/image/upload/folder/pic.png")
    ).toBe("folder/pic");
  });

  it("handles an id with no extension", () => {
    expect(
      parsePublicId("https://res.cloudinary.com/demo/image/upload/v123/folder/pic")
    ).toBe("folder/pic");
  });

  it("keeps dots inside the filename, trimming only the extension", () => {
    expect(
      parsePublicId("https://res.cloudinary.com/demo/image/upload/v1/my.photo.v2.jpg")
    ).toBe("my.photo.v2");
  });

  it("returns null for non-Cloudinary URLs so callers skip them", () => {
    // Seed images and hand-entered links live alongside real uploads; asking
    // Cloudinary to destroy one of these would be a pointless API call at best.
    expect(parsePublicId("https://images.unsplash.com/photo-123")).toBeNull();
    expect(parsePublicId("https://example.com/upload/v1/x.jpg")).toBeNull();
  });

  it("returns null for junk rather than throwing", () => {
    expect(parsePublicId("")).toBeNull();
    expect(parsePublicId("not a url")).toBeNull();
    expect(parsePublicId("https://res.cloudinary.com/demo/image/")).toBeNull();
    expect(parsePublicId("https://res.cloudinary.com/demo/image/upload/")).toBeNull();
    // A version segment with nothing after it is not an id.
    expect(parsePublicId("https://res.cloudinary.com/demo/image/upload/v123/")).toBeNull();
  });
});
