"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    // Unticked by default and never pre-ticked: a pre-ticked consent box is not
    // freely given consent under DPDP §6, and it is the specific dark pattern
    // the Act's "free, specific, informed, unconditional" wording rules out.
    defaultValues: { marketingConsent: false },
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    const result = await registerAction(data);
    if (result?.error) setServerError(result.error);
  };

  return (
    <>
      <h1 className="font-heading text-2xl text-charcoal">Create an account</h1>
      <p className="mt-2 text-sm text-graphite/70">
        Join MAA FURNITURE to shop, track orders, and save your details.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            autoComplete="name"
            autoCapitalize="words"
            placeholder="Your full name"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-brand-red">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            autoCapitalize="none"
            placeholder="you@email.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-brand-red">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            {...register("password")}
          />
          {errors.password ? (
            <p className="text-xs text-brand-red">
              {errors.password.message}
            </p>
          ) : (
            <p className="text-xs text-graphite/50">At least 8 characters.</p>
          )}
        </div>

        {/*
          The ONLY consent checkbox on this form. Everything else it collects —
          name, email, password — is needed to provide the account itself, which
          is contract performance under DPDP §7(a), not consent. A mandatory
          tick-to-continue box for those would be consent that is not freely
          given, and one the user could untick would break signup.
        */}
        <div className="rounded-lg border border-border bg-sand/30 p-3">
          <label
            htmlFor="marketingConsent"
            className="flex cursor-pointer items-start gap-3 text-sm text-graphite/80"
          >
            <input
              id="marketingConsent"
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-bronze"
              {...register("marketingConsent")}
            />
            <span>
              Email me new arrivals and offers.{" "}
              <span className="text-graphite/60">
                Optional. You can turn this off any time in Account → Privacy,
                and it never affects your orders.
              </span>
            </span>
          </label>
        </div>

        <div aria-live="polite">
          {serverError && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-500"
            >
              {serverError}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-bronze text-ivory hover:bg-bronze/90 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-ivory border-t-transparent"
              />
              <span>Creating Account…</span>
            </>
          ) : (
            "Create Account"
          )}
        </Button>

        {/*
          Notice, not consent. Deliberately NOT a checkbox: the processing this
          refers to runs on contract performance, and dressing it up as a
          tick-box would misstate the lawful basis. DPDP §5 requires the notice
          to be available at the point of collection, which is what this is.
        */}
        <p className="text-center text-xs text-graphite/50">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="underline hover:text-bronze">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-bronze">
            Privacy Notice
          </Link>
          .
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-graphite/70">
        Already have an account?{" "}
        <Link href="/login" className="text-bronze">
          Log in
        </Link>
      </p>
    </>
  );
}
