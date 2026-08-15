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
        // No phone number in the copy: this is a synchronous Zod schema with no
        // access to SiteSettings, so a number written here goes stale the day
        // the shop changes it and cannot be fixed from /admin.
        message:
          "We only deliver in Andhra Pradesh at the moment. Call or WhatsApp us using the contact details in the footer and we will help.",
        path: ["shippingState"],
      });
    }
  });

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;
