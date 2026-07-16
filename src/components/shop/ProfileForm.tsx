"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { updateProfile } from "@/actions/profile";

type ProfileInput = {
  name: string;
  password?: string;
  confirmPassword?: string;
};

export function ProfileForm({ initialName }: { initialName: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    defaultValues: {
      name: initialName,
      password: "",
      confirmPassword: "",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchPassword = watch("password");

  const onSubmit = async (data: ProfileInput) => {
    setServerError(null);
    setSuccess(false);

    if (data.password && data.password !== data.confirmPassword) {
      setServerError("Passwords do not match.");
      return;
    }

    const result = await updateProfile({
      name: data.name,
      password: data.password || undefined,
    });

    if (result?.error) {
      setServerError(result.error);
    } else {
      setSuccess(true);
      setValue("password", "");
      setValue("confirmPassword", "");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl bg-cream p-8">
      <h2 className="font-heading text-lg text-charcoal">Update Profile</h2>
      
      <div className="space-y-2">
        <Label htmlFor="profileName">Name</Label>
        <Input
          id="profileName"
          required
          {...register("name", {
            required: "Name is required",
            minLength: {
              value: 2,
              message: "Name must be at least 2 characters",
            },
          })}
        />
        {errors.name && (
          <p className="text-xs text-brand-red">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profilePassword">New Password (optional)</Label>
        <PasswordInput
          id="profilePassword"
          placeholder="Leave blank to keep current password"
          {...register("password", {
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters",
            },
          })}
        />
        {errors.password && (
          <p className="text-xs text-brand-red">{errors.password.message}</p>
        )}
      </div>

      {watchPassword && watchPassword.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="profileConfirmPassword">Confirm New Password</Label>
          <PasswordInput
            id="profileConfirmPassword"
            required={Boolean(watchPassword)}
            {...register("confirmPassword", {
              required: "Please confirm your new password",
            })}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-brand-red">{errors.confirmPassword.message}</p>
          )}
        </div>
      )}

      {serverError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-500 font-medium">
          {serverError}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-500 font-medium">
          Profile updated successfully.
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-bronze text-ivory hover:bg-bronze/90 flex items-center justify-center gap-2"
      >
        {isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
