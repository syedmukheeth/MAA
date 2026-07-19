"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowRight, ArrowLeft, Check, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrderTotals } from "./OrderTotals";
import { shippingAddressSchema, type ShippingAddressInput } from "@/lib/validations/checkout";
import { placeOrder } from "@/actions/orders";
import { formatINR } from "@/lib/format";
import { AP_LOCATIONS, type APLocation } from "@/lib/ap-locations";

export type CartItemData = {
  id: string;
  product: { name: string; price: string; images: string[] } | null;
  variant: { name: string; priceDelta: number } | null;
  combo: { name: string; bundlePrice: string } | null;
  quantity: number;
};

export type TotalsData = {
  subtotal: string;
  deliveryFee: string;
  taxRate: string;
  taxAmount: string;
  total: string;
};

export type SettingsData = {
  allowCOD: boolean;
  allowUPI: boolean;
  upiId: string | null;
  upiQrImage: string | null;
};

export function CheckoutWizard({
  cartItems,
  defaults,
  totals,
  settings,
}: {
  cartItems: CartItemData[];
  defaults?: Partial<ShippingAddressInput>;
  totals: TotalsData;
  settings: SettingsData;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "UPI">(() => {
    if (settings.allowCOD) return "COD";
    if (settings.allowUPI) return "UPI";
    return "COD"; // Fallback
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
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

  const handleNextToPayment = async () => {
    // Validate address fields before going to payment step
    const isValid = await trigger([
      "shippingName",
      "shippingPhone",
      "shippingLine1",
      "shippingCity",
      "shippingState",
      "shippingPincode",
    ]);
    if (isValid) {
      setStep(3);
    }
  };

  const onSubmit = async (data: ShippingAddressInput & { saveAddress?: boolean }) => {
    setServerError(null);

    // Double check that the selected payment method is allowed
    if (paymentMethod === "COD" && !settings.allowCOD) {
      setServerError("Cash on Delivery is currently unavailable.");
      return;
    }
    if (paymentMethod === "UPI" && !settings.allowUPI) {
      setServerError("UPI Payment is currently unavailable.");
      return;
    }

    const result = await placeOrder({
      ...data,
      paymentMethod,
    });

    if (result?.error) {
      setServerError(result.error);
      return;
    }
    router.push(`/checkout/success/${result.orderId}`);
  };

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
      {/* Left side: Step content */}
      <div className="space-y-8">
        {/* Visual Stepper */}
        <div className="flex items-center justify-between border-b border-linen pb-6">
          <div className="flex items-center gap-3">
            <span
              onClick={() => step > 1 && setStep(1)}
              className={`flex size-8 cursor-pointer items-center justify-center rounded-full text-xs font-semibold transition-all ${
                step === 1
                  ? "bg-bronze text-ivory ring-4 ring-bronze/10"
                  : step > 1
                    ? "bg-sage text-ivory"
                    : "bg-linen text-graphite/40"
              }`}
            >
              {step > 1 ? <Check size={14} /> : "1"}
            </span>
            <span
              onClick={() => step > 1 && setStep(1)}
              className={`text-sm font-medium cursor-pointer ${
                step === 1 ? "text-charcoal font-semibold" : "text-graphite/60 hover:text-bronze"
              }`}
            >
              Review Cart
            </span>
          </div>

          <div className="h-px flex-1 bg-linen mx-4" />

          <div className="flex items-center gap-3">
            <span
              onClick={() => step > 2 && setStep(2)}
              className={`flex size-8 cursor-pointer items-center justify-center rounded-full text-xs font-semibold transition-all ${
                step === 2
                  ? "bg-bronze text-ivory ring-4 ring-bronze/10"
                  : step > 2
                    ? "bg-sage text-ivory"
                    : "bg-linen text-graphite/40"
              }`}
            >
              {step > 2 ? <Check size={14} /> : "2"}
            </span>
            <span
              onClick={() => step > 2 && setStep(2)}
              className={`text-sm font-medium cursor-pointer ${
                step === 2 ? "text-charcoal font-semibold" : "text-graphite/60 hover:text-bronze"
              }`}
            >
              Delivery Info
            </span>
          </div>

          <div className="h-px flex-1 bg-linen mx-4" />

          <div className="flex items-center gap-3">
            <span
              className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                step === 3
                  ? "bg-bronze text-ivory ring-4 ring-bronze/10"
                  : "bg-linen text-graphite/40"
              }`}
            >
              3
            </span>
            <span
              className={`text-sm font-medium ${
                step === 3 ? "text-charcoal font-semibold" : "text-graphite/40"
              }`}
            >
              Payment
            </span>
          </div>
        </div>

        {/* Step contents */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-linen bg-white p-6 space-y-4">
              <h2 className="font-heading text-xl text-charcoal">Review Your Order</h2>
              <div className="divide-y divide-linen">
                {cartItems.map((item) => {
                  const image =
                    item.product?.images?.[0] ??
                    "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=600&auto=format&fit=crop";
                  const name = item.product?.name ?? item.combo?.name ?? "Product";
                  const desc = item.variant?.name
                    ? `Variant: ${item.variant.name}`
                    : item.combo
                      ? "Custom Combo Bundle"
                      : "";
                  const itemPrice = item.product
                    ? Number(item.product.price) + (item.variant?.priceDelta ?? 0)
                    : Number(item.combo?.bundlePrice ?? 0);

                  return (
                    <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-linen bg-cream">
                        <img
                          src={image}
                          alt={name}
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-charcoal truncate">{name}</h3>
                        {desc && <p className="text-xs text-graphite/60 mt-0.5">{desc}</p>}
                        <p className="text-xs text-graphite/60 mt-1">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-charcoal">
                          {formatINR(itemPrice * item.quantity)}
                        </p>
                        <p className="text-[10px] text-graphite/50">
                          {formatINR(itemPrice)} each
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                className="rounded-full bg-bronze text-ivory hover:bg-bronze/90 flex items-center gap-2 px-6"
              >
                Next: Delivery Address <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-cream p-8 space-y-6">
              <h2 className="font-heading text-xl text-charcoal">Delivery Address</h2>

              <div className="space-y-6">
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
                      <p className="text-xs text-brand-red">{errors.shippingPincode.message}</p>
                    )}
                  </div>
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
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(1)}
                className="rounded-full text-graphite hover:text-charcoal flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Back
              </Button>
              <Button
                type="button"
                onClick={handleNextToPayment}
                className="rounded-full bg-bronze text-ivory hover:bg-bronze/90 flex items-center gap-2 px-6"
              >
                Next: Payment Option <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-2xl border border-linen bg-white p-8 space-y-6">
              <h2 className="font-heading text-xl text-charcoal">Select Payment Option</h2>

              <div className="space-y-4">
                {/* Cash on Delivery option */}
                <div
                  className={`rounded-xl border p-5 transition-all duration-300 ${
                    !settings.allowCOD
                      ? "border-linen/50 bg-linen/10 opacity-60"
                      : paymentMethod === "COD"
                        ? "border-[#B08D57] bg-cream/40"
                        : "border-linen hover:border-bronze/50 cursor-pointer bg-white"
                  }`}
                  onClick={() => settings.allowCOD && setPaymentMethod("COD")}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentMethod === "COD"}
                      disabled={!settings.allowCOD}
                      onChange={() => setPaymentMethod("COD")}
                      className="mt-1 size-4 text-bronze focus:ring-bronze"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-charcoal">Cash on Delivery (COD)</p>
                      <p className="text-xs text-graphite/60 mt-1">Pay with cash or UPI when your furniture arrives at your doorstep.</p>
                      {!settings.allowCOD && (
                        <p className="text-xs text-brand-red mt-2 font-medium bg-brand-red/5 p-2.5 rounded-lg">
                          We apologize, but Cash on Delivery is currently disabled by the shop management.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* UPI option */}
                <div
                  className={`rounded-xl border p-5 transition-all duration-300 ${
                    !settings.allowUPI
                      ? "border-linen/50 bg-linen/10 opacity-60"
                      : paymentMethod === "UPI"
                        ? "border-[#B08D57] bg-cream/40"
                        : "border-linen hover:border-bronze/50 cursor-pointer bg-white"
                  }`}
                  onClick={() => settings.allowUPI && setPaymentMethod("UPI")}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="paymentOption"
                      checked={paymentMethod === "UPI"}
                      disabled={!settings.allowUPI}
                      onChange={() => setPaymentMethod("UPI")}
                      className="mt-1 size-4 text-bronze focus:ring-bronze"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-charcoal">UPI / QR Code Payment</p>
                      <p className="text-xs text-graphite/60 mt-1">Pay instantly using any UPI app (GPay, PhonePe, Paytm, etc.).</p>
                      {!settings.allowUPI && (
                        <p className="text-xs text-brand-red mt-2 font-medium bg-brand-red/5 p-2.5 rounded-lg">
                          We apologize, but UPI Payment is currently disabled by the shop management.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* UPI payment instructions / QR display */}
              {paymentMethod === "UPI" && settings.allowUPI && (
                <div className="rounded-xl border border-dashed border-bronze/30 bg-cream/20 p-6 flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-bronze">
                    <QrCode size={20} />
                    <span className="font-heading font-medium">Scan to Pay</span>
                  </div>

                  {settings.upiQrImage ? (
                    <div className="relative size-48 rounded-lg overflow-hidden border border-linen bg-white p-2 shadow-sm">
                      <img
                        src={settings.upiQrImage}
                        alt="UPI QR Code"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="size-48 rounded-lg border border-linen bg-linen/20 flex flex-col items-center justify-center text-graphite/40">
                      <QrCode size={40} className="stroke-1 mb-2" />
                      <p className="text-xs px-4">UPI QR Code will be provided by manager</p>
                    </div>
                  )}

                  {settings.upiId && (
                    <div className="space-y-1">
                      <p className="text-xs text-graphite/60">UPI ID</p>
                      <p className="text-sm font-mono font-bold text-charcoal bg-white px-3 py-1.5 rounded-full border border-linen select-all">
                        {settings.upiId}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-graphite/60 max-w-sm">
                    Please scan the QR code above or pay to the UPI ID. Once the payment is sent, click &quot;Place Order&quot; below to submit your order request.
                  </p>
                </div>
              )}
            </div>

            {serverError && <p className="text-sm text-brand-red">{serverError}</p>}

            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(2)}
                className="rounded-full text-graphite hover:text-charcoal flex items-center gap-2"
              >
                <ArrowLeft size={16} /> Back
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-bronze text-ivory hover:bg-bronze/90 flex items-center justify-center gap-2 px-8 py-6 text-base shadow-md cursor-pointer"
              >
                {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                {isSubmitting ? "Placing Order..." : `Place Order · ${formatINR(totals.total)}`}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Right side: Sticky summary */}
      <div className="lg:w-72 sticky lg:top-8 shrink-0">
        <OrderTotals
          subtotal={totals.subtotal.toString()}
          deliveryFee={totals.deliveryFee.toString()}
          taxRate={totals.taxRate.toString()}
          taxAmount={totals.taxAmount.toString()}
          total={totals.total.toString()}
        />
        <p className="mt-4 px-1 text-xs text-graphite/60">
          Delivery is restricted to Andhra Pradesh only. Average delivery times are 5-7 business days.
        </p>
      </div>
    </div>
  );
}
