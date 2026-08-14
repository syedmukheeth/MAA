import { z } from "zod";

/**
 * Input schemas for the DPDP rights endpoints.
 *
 * Shared between the client forms (zodResolver) and the server actions
 * (safeParse), the same way auth.ts and address.ts are, so a validation rule
 * cannot exist on only one side.
 */

export const consentToggleSchema = z.object({
  purpose: z.enum(["MARKETING_EMAIL", "TESTIMONIAL_PUBLICATION"]),
  granted: z.boolean(),
});

/**
 * Fields a principal can ask us to correct.
 *
 * `name` is absent on purpose: it is already self-service through
 * updateProfile, and duplicating it here as a staff ticket would be a slower
 * path to the same result. The UI links to the profile form instead.
 *
 * `email` and `orderAddress` are staff-mediated because email is the login
 * identifier and order shipping details are part of a tax invoice — neither can
 * be rewritten by the account holder without breaking something.
 */
export const correctionRequestSchema = z.object({
  field: z.enum(["email", "orderAddress", "other"]),
  detail: z
    .string()
    .min(10, "Please tell us what needs correcting, in a sentence or two")
    .max(1000, "Please keep this under 1000 characters"),
});

export const grievanceSchema = z.object({
  category: z.enum([
    "DATA_ACCURACY",
    "UNAUTHORISED_USE",
    "REQUEST_NOT_HONOURED",
    "CONSENT",
    "OTHER",
  ]),
  body: z
    .string()
    .min(20, "Please describe the problem in at least a sentence")
    .max(2000, "Please keep this under 2000 characters"),
});

/**
 * Grievances from people who cannot sign in — never had an account, or their
 * account is already locked pending erasure and they want to cancel it.
 *
 * Collects an email because there is no session to reply through. That is new
 * personal data, so it is kept to the minimum: an address and the complaint,
 * nothing else, and the retention is covered in docs/privacy/03.
 */
export const publicGrievanceSchema = grievanceSchema.extend({
  email: z.string().email("Enter the email address we should reply to"),
});

/**
 * Deleting an account requires the current password, not just a session.
 *
 * Same reasoning as the password change in actions/profile.ts: a borrowed
 * browser or a stolen cookie must not be enough to destroy someone's account.
 * The typed confirmation is a second, deliberate speed bump — this is the one
 * irreversible action in the application.
 */
export const erasureRequestSchema = z.object({
  currentPassword: z.string().min(1, "Enter your password to confirm"),
  confirmation: z.literal("DELETE MY DATA", {
    message: 'Type "DELETE MY DATA" exactly to confirm',
  }),
});

export type ConsentToggleInput = z.infer<typeof consentToggleSchema>;
export type CorrectionRequestInput = z.infer<typeof correctionRequestSchema>;
export type GrievanceInput = z.infer<typeof grievanceSchema>;
export type PublicGrievanceInput = z.infer<typeof publicGrievanceSchema>;
export type ErasureRequestInput = z.infer<typeof erasureRequestSchema>;

export const GRIEVANCE_CATEGORY_LABELS: Record<
  GrievanceInput["category"],
  string
> = {
  DATA_ACCURACY: "My data is wrong and has not been fixed",
  UNAUTHORISED_USE: "My data was used in a way I did not agree to",
  REQUEST_NOT_HONOURED: "I made a request and did not get a response",
  CONSENT: "Something about consent or marketing emails",
  OTHER: "Something else",
};

export const CORRECTION_FIELD_LABELS: Record<
  CorrectionRequestInput["field"],
  string
> = {
  email: "My email address",
  orderAddress: "The delivery address on a past order",
  other: "Something else",
};
