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
import { Loader2 } from "lucide-react";
// From @/lib/format, not @/lib/money — money imports Prisma, which cannot be
// bundled into a client component.
import { formatINR } from "@/lib/format";

export function ShippingAddressForm({
  total,
  defaults,
}: {
  /** Decimal as string — the final amount incl. delivery, matching OrderTotals. */
  total: string;
  defaults?: Partial<ShippingAddressInput>;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ShippingAddressInput & { saveAddress?: boolean }>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      ...defaults,
      saveAddress: true,
    },
  });

  const onSubmit = async (data: ShippingAddressInput & { saveAddress?: boolean }) => {
    setServerError(null);
    const result = await placeOrder(data);
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    router.push(`/checkout/success/${result.orderId}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="shippingName">Full Name</Label>
        <Input id="shippingName" {...register("shippingName")} />
        {errors.shippingName && (
          <p className="text-xs text-brand-red">{errors.shippingName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="shippingPhone">Contact Number</Label>
        <Input id="shippingPhone" placeholder="10-digit number" {...register("shippingPhone")} />
        {errors.shippingPhone && (
          <p className="text-xs text-brand-red">{errors.shippingPhone.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="shippingLine1">Address Line 1</Label>
        <Input
          id="shippingLine1"
          placeholder="House/Flat No, Street, Landmark"
          {...register("shippingLine1")}
        />
        {errors.shippingLine1 && (
          <p className="text-xs text-brand-red">{errors.shippingLine1.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="shippingLine2">Address Line 2 (optional)</Label>
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

      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="saveAddress"
          {...register("saveAddress")}
          className="size-4 rounded border-border text-bronze focus:ring-bronze"
        />
        <Label htmlFor="saveAddress" className="font-normal cursor-pointer select-none">
          Save this address to my profile for future orders
        </Label>
      </div>

      {serverError && <p className="text-sm text-brand-red">{serverError}</p>}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-bronze text-ivory hover:bg-bronze/90 flex items-center justify-center gap-2"
      >
        {isSubmitting && <Loader2 className="animate-spin" size={16} />}
        {isSubmitting ? "Placing order..." : `Place Order · ${formatINR(total)}`}
      </Button>
    </form>
  );
}
