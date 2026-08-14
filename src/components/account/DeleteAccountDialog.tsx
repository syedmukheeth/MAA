"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { requestErasure } from "@/actions/privacy";
import {
  erasureRequestSchema,
  type ErasureRequestInput,
} from "@/lib/validations/privacy";

/**
 * Account deletion.
 *
 * Two speed bumps, both deliberate and neither a dark pattern: the current
 * password, because a stolen cookie must not be able to destroy an account and
 * the real owner cannot undo it afterwards; and a typed confirmation, because
 * this is the only irreversible action in the application.
 *
 * Note what is NOT here — no "are you sure you want to lose your order
 * history", no discount offer, no multi-step retention funnel. Those exist to
 * make leaving harder, which is the thing DPDP §6(6) forbids for consent and
 * which would be equally dishonest here.
 */
export function DeleteAccountDialog({
  retentionYears,
}: {
  retentionYears: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ErasureRequestInput>({
    resolver: zodResolver(erasureRequestSchema),
  });

  const onSubmit = async (data: ErasureRequestInput) => {
    setError(null);
    const res = await requestErasure(data);
    if (res.error) {
      setError(res.error);
      return;
    }
    setDone(res.message ?? "Your request has been recorded.");
    // The session cookie is already cleared server-side; refresh so the app
    // stops rendering a signed-in shell around a locked account.
    router.refresh();
  };

  if (done) {
    return (
      <div className="rounded-lg border border-bronze/30 bg-sand/40 p-4 text-sm text-graphite/80">
        {done}
      </div>
    );
  }

  if (!open) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-graphite/70">
          We will delete your account, saved addresses, cart, custom enquiries
          and any photos you uploaded. We have to keep the invoices for orders
          you have already placed for {retentionYears} years — Indian tax law
          requires it — but we remove your name, phone number and street address
          from them.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(true)}
          className="rounded-full border-brand-red/40 text-brand-red hover:bg-brand-red/5"
        >
          Delete my account
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="erasure-password">Your password</Label>
        <PasswordInput
          id="erasure-password"
          autoComplete="current-password"
          {...register("currentPassword")}
        />
        {errors.currentPassword && (
          <p className="text-xs text-brand-red">
            {errors.currentPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="erasure-confirm">
          Type <span className="font-mono">DELETE MY DATA</span> to confirm
        </Label>
        <Input
          id="erasure-confirm"
          autoComplete="off"
          spellCheck={false}
          {...register("confirmation")}
        />
        {errors.confirmation && (
          <p className="text-xs text-brand-red">{errors.confirmation.message}</p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-brand-red">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-brand-red text-ivory hover:bg-brand-red/90"
        >
          {isSubmitting ? "Submitting…" : "Delete my account"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          className="rounded-full"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
