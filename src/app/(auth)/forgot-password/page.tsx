"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordAction } from "@/actions/auth";

type ForgotInput = {
  email: string;
};

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotInput>();

  const onSubmit = async (data: ForgotInput) => {
    setServerError(null);
    const result = await forgotPasswordAction(data.email);
    if (result?.error) {
      setServerError(result.error);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <h1 className="font-heading text-2xl text-charcoal">Check your email</h1>
        <p className="mt-4 text-sm text-graphite/70 leading-relaxed">
          We&apos;ve sent a password reset link to your email address if it is registered in our system.
        </p>
        <div className="mt-8">
          <Link
            href="/login"
            className="rounded-full bg-bronze px-6 py-2.5 text-sm text-ivory hover:bg-bronze/90"
          >
            Back to Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-heading text-2xl text-charcoal">Reset Password</h1>
      <p className="mt-2 text-sm text-graphite/70">
        Enter your email to receive a password reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            required
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
          />
          {errors.email && (
            <p className="text-xs text-brand-red">{errors.email.message}</p>
          )}
        </div>

        {serverError && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500 font-medium">
            {serverError}
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-bronze text-ivory hover:bg-bronze/90 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-ivory border-t-transparent" />
              <span>Sending link...</span>
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-graphite/70">
        Remember your password?{" "}
        <Link href="/login" className="text-bronze">
          Log In
        </Link>
      </p>
    </>
  );
}
