import { z } from "zod";

export const addressSchema = z.object({
  label: z.string().optional(),
  name: z.string().min(2, "Name is required"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number"),
  line1: z.string().min(4, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  isDefault: z.boolean(),
});

export type AddressInput = z.infer<typeof addressSchema>;
