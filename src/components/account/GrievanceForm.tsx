"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitGrievance } from "@/actions/privacy";
import {
  grievanceSchema,
  GRIEVANCE_CATEGORY_LABELS,
  type GrievanceInput,
} from "@/lib/validations/privacy";

export function GrievanceForm() {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<GrievanceInput>({
    resolver: zodResolver(grievanceSchema),
    defaultValues: { category: "OTHER" },
  });

  const onSubmit = async (data: GrievanceInput) => {
    setResult(null);
    const res = await submitGrievance(data);
    setResult({
      ok: Boolean(res.success),
      message: res.error ?? res.message ?? "Submitted.",
    });
    if (res.success) reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="grievance-category">What is this about?</Label>
        <select
          id="grievance-category"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          {...register("category")}
        >
          {Object.entries(GRIEVANCE_CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="grievance-body">Tell us what happened</Label>
        <Textarea
          id="grievance-body"
          rows={4}
          maxLength={2000}
          {...register("body")}
        />
        {errors.body && (
          <p className="text-xs text-brand-red">{errors.body.message}</p>
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
        {isSubmitting ? "Sending…" : "Submit complaint"}
      </Button>
    </form>
  );
}
