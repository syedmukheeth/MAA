"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  shippingAddressSchema,
  type ShippingAddressInput,
} from "@/lib/validations/checkout";
import { placeOrder } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ShippingAddressForm({ subtotal }: { subtotal: number }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ShippingAddressInput>({
    resolver: zodResolver(shippingAddressSchema),
  });

  const onSubmit = async (data: ShippingAddressInput) => {
    setServerError(null);
    const result = await placeOrder(data);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    router.push(`/checkout/success/${result.orderId}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="shippingName">Full name</Label>
          <Input id="shippingName" {...register("shippingName")} />
          {errors.shippingName && (
            <p className="text-xs text-brand-red">{errors.shippingName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="shippingPhone">Phone</Label>
          <Input id="shippingPhone" {...register("shippingPhone")} />
          {errors.shippingPhone && (
            <p className="text-xs text-brand-red">{errors.shippingPhone.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="shippingLine1">Address line 1</Label>
        <Input id="shippingLine1" {...register("shippingLine1")} />
        {errors.shippingLine1 && (
          <p className="text-xs text-brand-red">{errors.shippingLine1.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="shippingLine2">Address line 2 (optional)</Label>
        <Input id="shippingLine2" {...register("shippingLine2")} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="shippingCity">City</Label>
          <Input id="shippingCity" {...register("shippingCity")} />
          {errors.shippingCity && (
            <p className="text-xs text-brand-red">{errors.shippingCity.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="shippingState">State</Label>
          <Input id="shippingState" {...register("shippingState")} />
          {errors.shippingState && (
            <p className="text-xs text-brand-red">{errors.shippingState.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="shippingPincode">Pincode</Label>
          <Input id="shippingPincode" {...register("shippingPincode")} />
          {errors.shippingPincode && (
            <p className="text-xs text-brand-red">
              {errors.shippingPincode.message}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-lg bg-cream p-4 text-sm text-graphite/70">
        Payment method: <span className="text-charcoal">Cash on Delivery</span>
      </div>

      {serverError && <p className="text-sm text-brand-red">{serverError}</p>}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-bronze text-ivory hover:bg-bronze/90"
      >
        {isSubmitting ? "Placing order..." : `Place Order · ₹${subtotal.toFixed(2)}`}
      </Button>
    </form>
  );
}
