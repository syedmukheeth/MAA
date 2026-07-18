import { z } from "zod";

export const shippingAddressSchema = z.object({
  shippingName: z.string().min(2, "Name is required"),
  shippingPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
  shippingLine1: z.string().min(4, "Address is required"),
  shippingLine2: z.string().optional(),
  shippingCity: z.string().min(2, "City is required"),
  shippingState: z
    .string()
    .min(2, "State is required")
    .refine(
      (val) => {
        const s = val.toLowerCase().trim();
        return s === "andhra pradesh" || s === "ap" || s === "andhra";
      },
      {
        message: "We only deliver in Andhra Pradesh currently. We will come there soon or contact to this number: 8886995345 / 9912330151",
      }
    ),
  shippingPincode: z
    .string()
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode")
    .refine(
      (val) => /^(51|52|53)\d{4}$/.test(val),
      {
        message: "We only deliver in Andhra Pradesh currently (pincodes starting with 51, 52, 53). We will come there soon or contact to this number: 8886995345 / 9912330151",
      }
    ),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
