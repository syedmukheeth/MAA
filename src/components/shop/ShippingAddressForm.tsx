"use client";

import { useState, useMemo } from "react";
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
import { AP_LOCATIONS, type APLocation } from "@/lib/ap-locations";

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
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ShippingAddressInput & { saveAddress?: boolean }>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      ...defaults,
      saveAddress: true,
    },
  });

  const watchedCity = watch("shippingCity") || "";
  const watchedPincode = watch("shippingPincode") || "";

  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showPincodeSuggestions, setShowPincodeSuggestions] = useState(false);

  const citySuggestions = useMemo(() => {
    const query = watchedCity.toLowerCase().trim();
    if (query.length < 1) return [];
    const matches: APLocation[] = [];
    const seenCities = new Set<string>();
    for (const loc of AP_LOCATIONS) {
      if (loc.city.toLowerCase().includes(query)) {
        if (!seenCities.has(loc.city.toLowerCase())) {
          seenCities.add(loc.city.toLowerCase());
          matches.push(loc);
        }
      }
    }
    return matches.slice(0, 5);
  }, [watchedCity]);

  const pincodeSuggestions = useMemo(() => {
    const query = watchedPincode.trim();
    if (query.length < 1) return [];
    return AP_LOCATIONS.filter((loc) => loc.pincode.startsWith(query)).slice(0, 5);
  }, [watchedPincode]);

  const selectLocation = (loc: APLocation) => {
    setValue("shippingCity", loc.city);
    setValue("shippingState", "Andhra Pradesh");
    setValue("shippingPincode", loc.pincode);
    setShowCitySuggestions(false);
    setShowPincodeSuggestions(false);
  };

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
        <div className="space-y-2 relative">
          <Label htmlFor="shippingCity">City</Label>
          <Input
            id="shippingCity"
            {...register("shippingCity")}
            onFocus={() => setShowCitySuggestions(true)}
            onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
            autoComplete="off"
          />
          {showCitySuggestions && citySuggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 rounded-lg border border-linen bg-white py-1 shadow-lg max-h-48 overflow-y-auto">
              {citySuggestions.map((loc) => (
                <button
                  key={`${loc.city}-${loc.pincode}`}
                  type="button"
                  onMouseDown={() => selectLocation(loc)}
                  className="w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-cream hover:text-bronze transition-colors cursor-pointer"
                >
                  <span className="font-semibold">{loc.city}</span> ({loc.pincode})
                </button>
              ))}
            </div>
          )}
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
        <div className="space-y-2 relative">
          <Label htmlFor="shippingPincode">Pincode</Label>
          <Input
            id="shippingPincode"
            {...register("shippingPincode")}
            onFocus={() => setShowPincodeSuggestions(true)}
            onBlur={() => setTimeout(() => setShowPincodeSuggestions(false), 200)}
            autoComplete="off"
          />
          {showPincodeSuggestions && pincodeSuggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 rounded-lg border border-linen bg-white py-1 shadow-lg max-h-48 overflow-y-auto">
              {pincodeSuggestions.map((loc) => (
                <button
                  key={`${loc.city}-${loc.pincode}`}
                  type="button"
                  onMouseDown={() => selectLocation(loc)}
                  className="w-full px-4 py-2 text-left text-sm text-charcoal hover:bg-cream hover:text-bronze transition-colors cursor-pointer"
                >
                  <span className="font-semibold">{loc.pincode}</span> &middot; {loc.city}
                </button>
              ))}
            </div>
          )}
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
