"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/actions/auth";

type ChangePasswordInput = {
  currentPassword?: string;
  password?: string;
  confirmPassword?: string;
};

/**
 * Shared by the forced screen (`/change-password`) and the voluntary one
 * (`/admin/account`). `requireCurrent` only controls what the form asks for —
 * the server decides whether the current password is genuinely optional, from
 * the account's own `mustChangePassword` flag.
 */
export function ChangePasswordForm({
  requireCurrent,
  submitLabel = "Update Password",
  redirectTo,
}: {
  requireCurrent: boolean;
  submitLabel?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const statusRef = useRef<HTMLParagraphElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>();

  useEffect(() => {
    if (success) statusRef.current?.focus();
  }, [success]);

  const onSubmit = async (data: ChangePasswordInput) => {
    setServerError(null);
    const result = await changePasswordAction(data);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    reset();
    setSuccess(true);
    if (redirectTo) {
      // The cookie was re-issued server-side; refresh so the new session (and
      // the now-cleared must-change flag) is what the next render sees.
      router.replace(redirectTo);
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
      {requireCurrent && (
        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <PasswordInput
            id="currentPassword"
            autoComplete="current-password"
            {...register("currentPassword", {
              required: "Your current password is required",
            })}
          />
          {errors.currentPassword && (
            <p className="text-xs text-brand-red">{errors.currentPassword.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">New Password</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters long",
            },
          })}
        />
        {errors.password ? (
          <p className="text-xs text-brand-red">{errors.password.message}</p>
        ) : (
          <p className="text-xs text-graphite/50">
            At least 8 characters, with an uppercase letter, a lowercase letter and a
            number.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value, formValues) =>
              value === formValues.password || "Passwords do not match",
          })}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-brand-red">{errors.confirmPassword.message}</p>
        )}
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
        {success && !redirectTo && (
          <p
            ref={statusRef}
            tabIndex={-1}
            className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600 outline-none"
          >
            Password updated. Any other devices signed in to this account have been
            signed out.
          </p>
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
            <span>Updating…</span>
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
