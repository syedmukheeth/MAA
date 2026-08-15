import { z } from "zod";

/**
 * The one definition of an acceptable password.
 *
 * Shared with resetPasswordAction, which previously checked only `length >= 8`
 * inline — so the weakest path to setting a password was the one reachable with
 * nothing but access to an email inbox.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number");

export const registerSchema = z.object({
  name: z.string().min(2, "Name is too short").max(80),
  email: z.string().email("Enter a valid email"),
  password: passwordSchema,
  /**
   * Marketing email is the only thing at signup that runs on consent (DPDP §6).
   * Everything else the form collects is needed to perform the contract the
   * account itself is, so none of it gets a checkbox — a tick-to-proceed box is
   * not freely given consent, and one the user could untick would break signup.
   *
   * Required rather than defaulted: a `.default(false)` would make the parsed
   * input type optional, and a caller that simply omitted the field would be
   * accepted. Requiring it means the only way to register is to state a
   * position either way, and the form ships that position as `false`.
   */
  marketingConsent: z.boolean(),
});

export const loginSchema = z.object({
  // A bare username was accepted while loginAction expanded it to
  // `<name>@maafurnitures.com`. That expansion is gone (the domain was not the
  // one the site runs on), so anything that is not a full address can only ever
  // miss — failing here says so instead of returning "invalid email or password".
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  next: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
