import { z } from "zod";

export const addressSchema = z
  .object({
    label: z.string().optional(),
    name: z.string().min(2, "Name is required"),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
    line1: z.string().min(4, "Address is required"),
    line2: z.string().optional(),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z
      .string()
      .regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
    isDefault: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const s = data.state.toLowerCase().trim();
    const isAPState = s === "andhra pradesh" || s === "ap" || s === "andhra";
    const isAPPincode = /^(51|52|53)\d{4}$/.test(data.pincode);

    if (!isAPState || !isAPPincode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "We only deliver in Andhra Pradesh currently. We will come there soon or contact to this number: 8886995345 / 9912330151",
        path: ["state"],
      });
    }
  });

export type AddressInput = z.infer<typeof addressSchema>;
