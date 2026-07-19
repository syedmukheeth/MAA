import { z } from "zod";

export const shippingAddressSchema = z
  .object({
    shippingName: z.string().min(2, "Name is required"),
    shippingPhone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
    shippingLine1: z.string().min(4, "Address is required"),
    shippingLine2: z.string().optional(),
    shippingCity: z.string().min(2, "City is required"),
    shippingState: z.string().min(2, "State is required"),
    shippingPincode: z
      .string()
      .regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  })
  .superRefine((data, ctx) => {
    const s = data.shippingState.toLowerCase().trim();
    const isAPState = s === "andhra pradesh" || s === "ap" || s === "andhra";
    const isAPPincode = /^(51|52|53)\d{4}$/.test(data.shippingPincode);

    if (!isAPState || !isAPPincode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "We only deliver in Andhra Pradesh currently. We will come there soon or contact to this number: 8886995345 / 9912330151",
        path: ["shippingState"],
      });
    }
  });

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
