"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { requestCorrection } from "@/actions/privacy";
import {
  correctionRequestSchema,
  CORRECTION_FIELD_LABELS,
  type CorrectionRequestInput,
} from "@/lib/validations/privacy";

export function CorrectionForm() {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CorrectionRequestInput>({
    resolver: zodResolver(correctionRequestSchema),
    defaultValues: { field: "email" },
  });

  const onSubmit = async (data: CorrectionRequestInput) => {
    setResult(null);
    const res = await requestCorrection(data);
    setResult({
      ok: Boolean(res.success),
      message: res.error ?? res.message ?? "Submitted.",
    });
    if (res.success) reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="correction-field">What needs correcting?</Label>
        <select
          id="correction-field"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          {...register("field")}
        >
          {Object.entries(CORRECTION_FIELD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="correction-detail">What should it say instead?</Label>
        <Textarea id="correction-detail" rows={3} {...register("detail")} />
        {errors.detail && (
          <p className="text-xs text-brand-red">{errors.detail.message}</p>
        )}
      </div>

      {result && (
        <p
          role="alert"
          className={`text-sm ${result.ok ? "text-graphite/70" : "text-brand-red"}`}
        >
          {result.message}
        </p>
      )}

      <Button
        type="submit"
        variant="outline"
        disabled={isSubmitting}
        className="rounded-full"
      >
        {isSubmitting ? "Sending…" : "Request correction"}
      </Button>
    </form>
  );
}
