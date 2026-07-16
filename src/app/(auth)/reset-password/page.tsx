"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { resetPasswordAction } from "@/actions/auth";

type ResetInput = {
  password?: string;
  confirmPassword?: string;
};

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetInput>();

  const onSubmit = async (data: ResetInput) => {
    if (!token) {
      setServerError("Reset token is missing from URL.");
      return;
    }
    setServerError(null);
    const result = await resetPasswordAction(token, data);
    if (result?.error) {
      setServerError(result.error);
    } else {
      setSuccess(true);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="font-heading text-2xl text-charcoal">Invalid Link</h1>
        <p className="mt-4 text-sm text-graphite/70">
          The password reset token is missing or invalid.
        </p>
        <div className="mt-8">
          <Link
            href="/forgot-password"
            className="rounded-full bg-bronze px-6 py-2.5 text-sm text-ivory hover:bg-bronze/90"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <h1 className="font-heading text-2xl text-charcoal">Password Reset</h1>
        <p className="mt-4 text-sm text-graphite/70 leading-relaxed">
          Your password has been successfully reset. You can now log in with your new password.
        </p>
        <div className="mt-8">
          <Link
            href="/login"
            className="rounded-full bg-bronze px-6 py-2.5 text-sm text-ivory hover:bg-bronze/90"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="font-heading text-2xl text-charcoal">New Password</h1>
      <p className="mt-2 text-sm text-graphite/70">
        Choose a secure password for your account.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <PasswordInput
            id="password"
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters long",
              },
            })}
          />
          {errors.password && (
            <p className="text-xs text-brand-red">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <PasswordInput
            id="confirmPassword"
            {...register("confirmPassword", {
              required: "Please confirm your password",
            })}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-brand-red">{errors.confirmPassword.message}</p>
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
              <span>Resetting password...</span>
            </>
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
