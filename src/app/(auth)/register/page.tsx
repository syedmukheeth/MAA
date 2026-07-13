"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    const result = await registerAction(data);
    if (result?.error) setServerError(result.error);
  };

  return (
    <>
      <h1 className="font-heading text-2xl text-charcoal">Create an account</h1>
      <p className="mt-2 text-sm text-graphite/70">
        Join MAA Furnitures to shop, track orders, and save your details.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="text-xs text-brand-red">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-xs text-brand-red">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register("password")} />
          {errors.password && (
            <p className="text-xs text-brand-red">
              {errors.password.message}
            </p>
          )}
        </div>

        {serverError && <p className="text-sm text-brand-red">{serverError}</p>}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-bronze text-ivory hover:bg-bronze/90"
        >
          {isSubmitting ? "Creating account..." : "Create Account"}
        </Button>
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
