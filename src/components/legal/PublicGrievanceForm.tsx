"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitPublicGrievance } from "@/actions/privacy";
import {
  publicGrievanceSchema,
  GRIEVANCE_CATEGORY_LABELS,
  type PublicGrievanceInput,
} from "@/lib/validations/privacy";

/**
 * The grievance channel for people with no usable session.
 *
 * This is a real form that writes a real row and sends real mail — unlike the
 * showroom "contact form" it replaces, which reported success and discarded the
 * message. It collects an email address because there is no other way to answer
 * a complaint from someone we cannot identify, and nothing else.
 */
export function PublicGrievanceForm() {
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PublicGrievanceInput>({
    resolver: zodResolver(publicGrievanceSchema),
    defaultValues: { category: "OTHER" },
  });

  const onSubmit = async (data: PublicGrievanceInput) => {
    setResult(null);
    const res = await submitPublicGrievance(data);
    setResult({
      ok: Boolean(res.success),
      message: res.error ?? res.message ?? "Submitted.",
    });
  };

  if (result?.ok) {
    return (
      <div className="rounded-lg border border-bronze/30 bg-sand/40 p-5 text-sm text-graphite/80">
        {result.message}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Your email address</Label>
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          spellCheck={false}
          placeholder="you@email.com"
          {...register("email")}
        />
        <p className="text-xs text-graphite/50">
          We only use this to reply to you about this complaint.
        </p>
        {errors.email && (
          <p className="text-xs text-brand-red">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">What is this about?</Label>
        <select
          id="category"
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
        <Label htmlFor="body">Tell us what happened</Label>
        <Textarea id="body" rows={6} maxLength={2000} {...register("body")} />
        {errors.body && (
          <p className="text-xs text-brand-red">{errors.body.message}</p>
        )}
      </div>

      {result && !result.ok && (
        <p role="alert" className="text-sm text-brand-red">
          {result.message}
        </p>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-bronze text-ivory hover:bg-bronze/90"
      >
        {isSubmitting ? "Sending…" : "Submit complaint"}
      </Button>
    </form>
  );
}
