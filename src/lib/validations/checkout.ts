import { z } from "zod";

export const shippingAddressSchema = z.object({
  shippingName: z.string().min(2, "Name is required"),
  shippingPhone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
  shippingLine1: z.string().min(4, "Address is required"),
  shippingLine2: z.string().optional(),
  shippingCity: z.string().min(2, "City is required"),
  shippingState: z.string().min(2, "State is required"),
  shippingPincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
