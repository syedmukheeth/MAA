import { describe, it, expect } from "vitest";
import { addressSchema } from "./address";
import { shippingAddressSchema } from "./checkout";

describe("address validation schemas", () => {
  const baseAddress = {
    name: "John Doe",
    phone: "9876543210",
    line1: "123 Main St",
    city: "Kurnool",
    isDefault: false,
  };

  it("should accept valid Andhra Pradesh states and pincodes", () => {
    const validAddresses = [
      { ...baseAddress, state: "Andhra Pradesh", pincode: "518002" },
      { ...baseAddress, state: "ap", pincode: "520001" },
      { ...baseAddress, state: "Andhra", pincode: "530003" },
      { ...baseAddress, state: "  ANDHRA PRADESH  ", pincode: "515001" },
    ];

    for (const addr of validAddresses) {
      const res = addressSchema.safeParse(addr);
      expect(res.success).toBe(true);
    }
  });

  it("should reject non-Andhra Pradesh states", () => {
    const invalidStates = [
      { ...baseAddress, state: "Karnataka", pincode: "518002" },
      { ...baseAddress, state: "Telangana", pincode: "518002" },
      { ...baseAddress, state: "Tamil Nadu", pincode: "518002" },
    ];

    for (const addr of invalidStates) {
      const res = addressSchema.safeParse(addr);
      expect(res.success).toBe(false);
      if (!res.success) {
        const error = res.error.format();
        expect(error.state?._errors[0]).toContain("We only deliver in Andhra Pradesh currently");
      }
    }
  });

  it("should reject non-Andhra Pradesh pincodes", () => {
    const invalidPincodes = [
      { ...baseAddress, state: "Andhra Pradesh", pincode: "560001" }, // Bangalore
      { ...baseAddress, state: "Andhra Pradesh", pincode: "500001" }, // Hyderabad
      { ...baseAddress, state: "Andhra Pradesh", pincode: "600001" }, // Chennai
      { ...baseAddress, state: "Andhra Pradesh", pincode: "110001" }, // Delhi
    ];

    for (const addr of invalidPincodes) {
      const res = addressSchema.safeParse(addr);
      expect(res.success).toBe(false);
      if (!res.success) {
        const error = res.error.format();
        expect(error.state?._errors[0]).toContain("We only deliver in Andhra Pradesh currently");
      }
    }
  });
});

describe("checkout shipping address schema", () => {
  const baseShipping = {
    shippingName: "Jane Doe",
    shippingPhone: "9876543210",
    shippingLine1: "456 Side St",
    shippingCity: "Vijayawada",
  };

  it("should accept valid AP states and pincodes during checkout", () => {
    const res = shippingAddressSchema.safeParse({
      ...baseShipping,
      shippingState: "Andhra Pradesh",
      shippingPincode: "520002",
    });
    expect(res.success).toBe(true);
  });

  it("should reject invalid state/pincode during checkout", () => {
    const res = shippingAddressSchema.safeParse({
      ...baseShipping,
      shippingState: "Maharashtra",
      shippingPincode: "400001",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const errors = res.error.format();
      expect(errors.shippingState?._errors[0]).toContain("We only deliver in Andhra Pradesh currently");
    }
  });
});
