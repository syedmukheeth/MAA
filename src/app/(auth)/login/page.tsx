"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    const result = await loginAction({ ...data, next: next ?? undefined });
    if (result?.error) setServerError(result.error);
  };

  return (
    <>
      <h1 className="font-heading text-2xl text-charcoal">Welcome back</h1>
      <p className="mt-2 text-sm text-graphite/70">
        Log in to your MAA FURNITURE account.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p className="text-xs text-brand-red">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" {...register("password")} />
          {errors.password && (
            <p className="text-xs text-brand-red">
              {errors.password.message}
            </p>
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
              <span>Logging in...</span>
            </>
          ) : (
            "Log In"
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-graphite/70">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-bronze">
          Create one
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
