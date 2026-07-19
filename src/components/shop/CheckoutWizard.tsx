"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowRight, ArrowLeft, Check, QrCode, ShoppingBag } from "lucide-react";
import Link from "next/link";
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
  product: { name: string; price: string; images: string[]; slug?: string | null } | null;
  variant: { name: string; priceDelta: number } | null;
  combo: { name: string; bundlePrice: string; slug?: string | null } | null;
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

/* ─────────────── stepper helper ─────────────── */
const STEPS = [
  { n: 1, label: "Review Cart" },
  { n: 2, label: "Delivery Info" },
  { n: 3, label: "Payment" },
] as const;

function Stepper({ step, setStep }: { step: 1 | 2 | 3; setStep: (s: 1 | 2 | 3) => void }) {
  return (
    <div className="flex items-center justify-between mb-8">
      {STEPS.map((s, idx) => {
        const done = step > s.n;
        const active = step === s.n;
        const canClick = done;
        return (
          <div key={s.n} className="flex items-center flex-1">
            <button
              type="button"
              disabled={!canClick}
              onClick={() => canClick && setStep(s.n as 1 | 2 | 3)}
              className="flex flex-col sm:flex-row items-center gap-2 group disabled:cursor-default"
            >
              <span
                className={`flex size-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                  active
                    ? "bg-bronze text-ivory ring-4 ring-bronze/20 scale-110"
                    : done
                      ? "bg-sage text-ivory hover:bg-sage/80"
                      : "bg-linen text-graphite/40"
                }`}
              >
                {done ? <Check size={16} /> : s.n}
              </span>
              <span
                className={`text-xs sm:text-sm font-medium transition-colors ${
                  active
                    ? "text-charcoal font-semibold"
                    : done
                      ? "text-sage hover:text-sage/80"
                      : "text-graphite/40"
                }`}
              >
                {s.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 transition-colors duration-500 ${step > s.n ? "bg-sage" : "bg-linen"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────── main wizard ─────────────── */
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
    return "COD";
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
    return matches.slice(0, 6);
  }, [watchedCity]);

  const pincodeSuggestions = useMemo(() => {
    const query = watchedPincode.trim();
    if (query.length < 1) return [];
    return AP_LOCATIONS.filter((loc) => loc.pincode.startsWith(query)).slice(0, 6);
  }, [watchedPincode]);

  const selectLocation = (loc: APLocation) => {
    setValue("shippingCity", loc.city);
    setValue("shippingState", "Andhra Pradesh");
    setValue("shippingPincode", loc.pincode);
    setShowCitySuggestions(false);
    setShowPincodeSuggestions(false);
  };

  const handleNextToPayment = async () => {
    const isValid = await trigger([
      "shippingName",
      "shippingPhone",
      "shippingLine1",
      "shippingCity",
      "shippingState",
      "shippingPincode",
    ]);
    if (isValid) setStep(3);
  };

  const onSubmit = async (data: ShippingAddressInput & { saveAddress?: boolean }) => {
    setServerError(null);
    if (paymentMethod === "COD" && !settings.allowCOD) {
      setServerError("Cash on Delivery is currently unavailable.");
      return;
    }
    if (paymentMethod === "UPI" && !settings.allowUPI) {
      setServerError("UPI Payment is currently unavailable.");
      return;
    }
    const result = await placeOrder({ ...data, paymentMethod });
    if (result?.error) {
      setServerError(result.error);
      return;
    }
    router.push(`/checkout/success/${result.orderId}`);
  };

  return (
    <div className="mt-6">
      <Stepper step={step} setStep={setStep} />

      {/* ── Step 1: Review Cart + Totals ── */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-linen bg-white p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-bronze" />
              <h2 className="font-heading text-xl text-charcoal">Review Your Order</h2>
            </div>
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

                const productHref = item.product?.slug
                  ? `/products/${item.product.slug}`
                  : item.combo?.slug
                    ? `/combos/${item.combo.slug}`
                    : null;

                const content = (
                  <div className="flex gap-4 py-4 first:pt-0 last:pb-0">
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

                return productHref ? (
                  <Link key={item.id} href={productHref} className="block hover:opacity-80 transition-opacity">
                    {content}
                  </Link>
                ) : (
                  <div key={item.id}>{content}</div>
                );
              })}
            </div>
          </div>

          {/* Totals shown at cart review step */}
          <OrderTotals
            subtotal={totals.subtotal.toString()}
            deliveryFee={totals.deliveryFee.toString()}
            taxRate={totals.taxRate.toString()}
            taxAmount={totals.taxAmount.toString()}
            total={totals.total.toString()}
          />

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              className="w-full sm:w-auto rounded-full bg-bronze text-ivory hover:bg-bronze/90 flex items-center justify-center gap-2 px-6 py-3"
            >
              Next: Delivery Address <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Address ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-cream p-5 sm:p-8 space-y-6">
            <h2 className="font-heading text-xl text-charcoal">Delivery Address</h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
                {/* City with autocomplete */}
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
                    <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-linen bg-white py-1 shadow-xl max-h-48 overflow-y-auto">
                      {citySuggestions.map((loc) => (
                        <button
                          key={`${loc.city}-${loc.pincode}`}
                          type="button"
                          onMouseDown={() => selectLocation(loc)}
                          className="w-full px-4 py-2.5 text-left text-sm text-charcoal hover:bg-cream hover:text-bronze transition-colors cursor-pointer"
                        >
                          <span className="font-semibold">{loc.city}</span>
                          <span className="text-graphite/50 ml-2 text-xs">{loc.pincode}</span>
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

                {/* Pincode with autocomplete */}
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
                    <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-linen bg-white py-1 shadow-xl max-h-48 overflow-y-auto">
                      {pincodeSuggestions.map((loc) => (
                        <button
                          key={`${loc.city}-${loc.pincode}`}
                          type="button"
                          onMouseDown={() => selectLocation(loc)}
                          className="w-full px-4 py-2.5 text-left text-sm text-charcoal hover:bg-cream hover:text-bronze transition-colors cursor-pointer"
                        >
                          <span className="font-semibold">{loc.pincode}</span>
                          <span className="text-graphite/50 ml-2 text-xs">· {loc.city}</span>
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

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
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
              className="w-full sm:w-auto rounded-full bg-bronze text-ivory hover:bg-bronze/90 flex items-center justify-center gap-2 px-6 py-3"
            >
              Next: Payment Option <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 3: Payment + Totals ── */}
      {step === 3 && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Totals shown at payment step */}
          <OrderTotals
            subtotal={totals.subtotal.toString()}
            deliveryFee={totals.deliveryFee.toString()}
            taxRate={totals.taxRate.toString()}
            taxAmount={totals.taxAmount.toString()}
            total={totals.total.toString()}
          />

          <div className="rounded-2xl border border-linen bg-white p-5 sm:p-8 space-y-6">
            <h2 className="font-heading text-xl text-charcoal">Select Payment Option</h2>

            <div className="space-y-4">
              {/* COD */}
              <div
                className={`rounded-xl border p-5 transition-all duration-300 cursor-pointer ${
                  !settings.allowCOD
                    ? "border-linen/50 bg-linen/10 opacity-60 cursor-not-allowed"
                    : paymentMethod === "COD"
                      ? "border-bronze bg-bronze/5 ring-1 ring-bronze/30"
                      : "border-linen hover:border-bronze/50 bg-white"
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
                    className="mt-1 size-4 accent-bronze focus:ring-bronze"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-charcoal">Cash on Delivery (COD)</p>
                    <p className="text-xs text-graphite/60 mt-1">Pay with cash or UPI when your furniture arrives at your doorstep.</p>
                    {!settings.allowCOD && (
                      <p className="text-xs text-brand-red mt-2 font-medium bg-brand-red/5 p-2.5 rounded-lg">
                        Cash on Delivery is currently disabled.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* UPI */}
              <div
                className={`rounded-xl border p-5 transition-all duration-300 cursor-pointer ${
                  !settings.allowUPI
                    ? "border-linen/50 bg-linen/10 opacity-60 cursor-not-allowed"
                    : paymentMethod === "UPI"
                      ? "border-bronze bg-bronze/5 ring-1 ring-bronze/30"
                      : "border-linen hover:border-bronze/50 bg-white"
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
                    className="mt-1 size-4 accent-bronze focus:ring-bronze"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-charcoal">UPI / QR Code Payment</p>
                    <p className="text-xs text-graphite/60 mt-1">Pay instantly using any UPI app (GPay, PhonePe, Paytm, etc.).</p>
                    {!settings.allowUPI && (
                      <p className="text-xs text-brand-red mt-2 font-medium bg-brand-red/5 p-2.5 rounded-lg">
                        UPI Payment is currently disabled.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* UPI QR */}
            {paymentMethod === "UPI" && settings.allowUPI && (
              <div className="rounded-xl border border-dashed border-bronze/30 bg-cream/20 p-6 flex flex-col items-center justify-center text-center space-y-4">
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
                  Scan the QR code or pay to the UPI ID above, then click &quot;Place Order&quot; to submit.
                </p>
              </div>
            )}
          </div>

          {serverError && <p className="text-sm text-brand-red">{serverError}</p>}

          <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3">
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
              className="w-full sm:w-auto rounded-full bg-bronze text-ivory hover:bg-bronze/90 flex items-center justify-center gap-2 px-8 py-4 text-base shadow-md cursor-pointer"
            >
              {isSubmitting && <Loader2 className="animate-spin" size={16} />}
              {isSubmitting ? "Placing Order..." : `Place Order · ${formatINR(totals.total)}`}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
