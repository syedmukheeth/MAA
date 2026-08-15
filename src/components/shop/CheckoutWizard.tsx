"use client";

import { useState, useMemo, type FocusEvent } from "react";
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

export type SavedAddressOption = {
  id: string;
  label: string | null;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export type SettingsData = {
  allowCOD: boolean;
  allowUPI: boolean;
  upiId: string | null;
  upiQrImage: string | null;
};

/**
 * The suggestion list closes only when focus leaves the whole field group.
 * An `onBlur` on the input alone tears the list down before a keyboard user can
 * Tab into it, which made the suggestions reachable by mouse only. Mirrors the
 * same helper in ShippingAddressForm.tsx.
 */
function closeOnBlur(setOpen: (open: boolean) => void) {
  return (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setOpen(false);
    }
  };
}

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
              aria-current={active ? "step" : undefined}
              aria-label={
                canClick
                  ? `Back to step ${s.n}: ${s.label}`
                  : `Step ${s.n}: ${s.label}`
              }
              className="flex flex-col sm:flex-row items-center gap-2 group rounded-lg disabled:cursor-default touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bronze focus-visible:ring-offset-2"
            >
              <span
                aria-hidden="true"
                className={`flex size-9 items-center justify-center rounded-full text-sm font-bold transition-[background-color,color,transform,box-shadow] duration-300 ${
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
              <div
                aria-hidden="true"
                className={`flex-1 h-0.5 mx-3 transition-colors duration-500 ${step > s.n ? "bg-sage" : "bg-linen"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PaymentOption({
  value,
  title,
  blurb,
  disabledNote,
  allowed,
  selected,
  onSelect,
}: {
  value: "COD" | "UPI";
  title: string;
  blurb: string;
  disabledNote: string;
  allowed: boolean;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border p-5 transition-[background-color,border-color,box-shadow] duration-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-bronze has-[:focus-visible]:ring-offset-2 ${
        !allowed
          ? "cursor-not-allowed border-linen/50 bg-linen/10 opacity-60"
          : selected
            ? "cursor-pointer border-bronze bg-bronze/5 ring-1 ring-bronze/30"
            : "cursor-pointer border-linen bg-white hover:border-bronze/50"
      }`}
    >
      <input
        type="radio"
        name="paymentOption"
        value={value}
        checked={selected}
        disabled={!allowed}
        onChange={onSelect}
        className="mt-1 size-4 shrink-0 accent-bronze"
      />
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-charcoal">{title}</span>
        <span className="mt-1 block text-xs text-graphite/60">{blurb}</span>
        {!allowed && (
          <span className="mt-2 block rounded-lg bg-brand-red/5 p-2.5 text-xs font-medium text-brand-red">
            {disabledNote}
          </span>
        )}
      </span>
    </label>
  );
}

/* ─────────────── main wizard ─────────────── */
export function CheckoutWizard({
  cartItems,
  defaults,
  savedAddresses = [],
  preselectedAddressId = null,
  totals,
  settings,
}: {
  cartItems: CartItemData[];
  defaults?: Partial<ShippingAddressInput>;
  savedAddresses?: SavedAddressOption[];
  preselectedAddressId?: string | null;
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
    getValues,
    getFieldState,
    setFocus,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ShippingAddressInput & { saveAddress?: boolean }>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      ...defaults,
      // Only offer to save when this is genuinely a new address. Defaulting to
      // true meant an address already in the profile was re-offered on every
      // order, which reads as "it didn't save last time".
      saveAddress: preselectedAddressId === null,
    },
  });

  // null = "Use a different address" (the manual form).
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    preselectedAddressId
  );

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

  const chooseSavedAddress = (addr: SavedAddressOption) => {
    setSelectedAddressId(addr.id);
    setValue("shippingName", addr.name, { shouldValidate: true });
    setValue("shippingPhone", addr.phone, { shouldValidate: true });
    setValue("shippingLine1", addr.line1, { shouldValidate: true });
    setValue("shippingLine2", addr.line2 ?? "");
    setValue("shippingCity", addr.city, { shouldValidate: true });
    setValue("shippingState", addr.state, { shouldValidate: true });
    setValue("shippingPincode", addr.pincode, { shouldValidate: true });
    // Already in the profile — nothing to save.
    setValue("saveAddress", false);
  };

  const chooseNewAddress = () => {
    setSelectedAddressId(null);
    setValue("shippingName", "");
    setValue("shippingPhone", "");
    setValue("shippingLine1", "");
    setValue("shippingLine2", "");
    setValue("shippingCity", "");
    setValue("shippingState", "");
    setValue("shippingPincode", "");
    setValue("saveAddress", true);
  };

  const selectLocation = (loc: APLocation) => {
    setValue("shippingCity", loc.city);
    setValue("shippingState", "Andhra Pradesh");
    setValue("shippingPincode", loc.pincode);
    setShowCitySuggestions(false);
    setShowPincodeSuggestions(false);
  };

  const ADDRESS_FIELDS = [
    "shippingName",
    "shippingPhone",
    "shippingLine1",
    "shippingCity",
    "shippingState",
    "shippingPincode",
  ] as const;

  const handleNextToPayment = async () => {
    const isValid = await trigger([...ADDRESS_FIELDS]);
    if (isValid) {
      setStep(3);
      return;
    }
    // A saved address can still fail validation (e.g. it predates the
    // Andhra-Pradesh-only rule). The form is hidden in that mode, so reveal it
    // — with its values intact — rather than blocking with nothing on screen.
    if (selectedAddressId !== null) setSelectedAddressId(null);

    // `trigger()` validates but does not move focus the way handleSubmit does.
    // Without this the button appears to do nothing when the offending field
    // has scrolled out of view.
    const firstBad = ADDRESS_FIELDS.find((f) => getFieldState(f).invalid);
    if (firstBad) setFocus(firstBad);
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
    // `saveAddress` is not part of shippingAddressSchema, so zodResolver strips
    // it out of `data` — reading it from `data` silently never saved anything.
    // Read it off the form state instead.
    const result = await placeOrder({
      ...data,
      saveAddress: getValues("saveAddress") === true,
      paymentMethod,
    });
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
              <ShoppingBag aria-hidden="true" size={18} className="text-bronze" />
              <h2 className="font-heading text-xl text-charcoal">Review Your Order</h2>
            </div>
            <div className="divide-y divide-linen">
              {cartItems.map((item) => {
                // Local placeholder, not a stock photo of some other sofa: this
                // renders next to a price the customer is about to pay, and an
                // unrelated image there misrepresents what they are buying.
                const image = item.product?.images?.[0] ?? "/placeholder-furniture.svg";
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
                        width={64}
                        height={64}
                        loading="lazy"
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
              Next: Delivery Address <ArrowRight aria-hidden="true" size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Address ── */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-cream p-5 sm:p-8 space-y-6">
            <h2 className="font-heading text-xl text-charcoal">Delivery Address</h2>

            {savedAddresses.length > 0 && (
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold uppercase tracking-wider text-graphite/60">
                  Saved Addresses
                </legend>
                {savedAddresses.map((addr) => (
                  <label
                    key={addr.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-linen bg-white p-4 transition-colors hover:border-bronze/50 has-[:checked]:border-bronze has-[:checked]:bg-bronze/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-bronze has-[:focus-visible]:ring-offset-2"
                  >
                    <input
                      type="radio"
                      name="savedAddress"
                      className="mt-1 size-4 shrink-0 accent-bronze"
                      checked={selectedAddressId === addr.id}
                      onChange={() => chooseSavedAddress(addr)}
                    />
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="block font-semibold text-charcoal">
                        {addr.name}
                        {addr.label ? ` · ${addr.label}` : ""}
                        {addr.isDefault && (
                          <span className="ml-2 rounded-full bg-sage/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sage">
                            Default
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block break-words text-graphite/70">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ""}, {addr.city},{" "}
                        {addr.state} {addr.pincode}
                      </span>
                      <span className="mt-0.5 block text-xs text-graphite/60">
                        {addr.phone}
                      </span>
                    </span>
                  </label>
                ))}

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-linen p-4 text-sm transition-colors hover:border-bronze/50 has-[:checked]:border-bronze has-[:checked]:bg-bronze/5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-bronze has-[:focus-visible]:ring-offset-2">
                  <input
                    type="radio"
                    name="savedAddress"
                    className="size-4 shrink-0 accent-bronze"
                    checked={selectedAddressId === null}
                    onChange={chooseNewAddress}
                  />
                  <span className="font-medium text-charcoal">
                    Deliver to a different address
                  </span>
                </label>
              </fieldset>
            )}

            <div
              className="space-y-6"
              hidden={savedAddresses.length > 0 && selectedAddressId !== null}
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="shippingName">Full Name</Label>
                  <Input
                    id="shippingName"
                    autoComplete="name"
                    placeholder="e.g. Ramesh Kumar"
                    {...register("shippingName")}
                  />
                  {errors.shippingName && (
                    <p className="text-xs text-brand-red">{errors.shippingName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingPhone">Contact Number</Label>
                  <Input
                    id="shippingPhone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    spellCheck={false}
                    placeholder="10-digit number"
                    {...register("shippingPhone")}
                  />
                  {errors.shippingPhone && (
                    <p className="text-xs text-brand-red">{errors.shippingPhone.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingLine1">Address Line 1</Label>
                <Input
                  id="shippingLine1"
                  autoComplete="address-line1"
                  placeholder="House/Flat No, Street, Landmark"
                  {...register("shippingLine1")}
                />
                {errors.shippingLine1 && (
                  <p className="text-xs text-brand-red">{errors.shippingLine1.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingLine2">Address Line 2 (optional)</Label>
                <Input
                  id="shippingLine2"
                  autoComplete="address-line2"
                  placeholder="Area, Colony (optional)"
                  {...register("shippingLine2")}
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                {/* City with autocomplete */}
                <div
                  className="space-y-2 relative"
                  onBlur={closeOnBlur(setShowCitySuggestions)}
                >
                  <Label htmlFor="shippingCity">City</Label>
                  <Input
                    id="shippingCity"
                    {...register("shippingCity")}
                    onFocus={() => setShowCitySuggestions(true)}
                    autoComplete="off"
                  />
                  {showCitySuggestions && citySuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-linen bg-white py-1 shadow-xl max-h-48 overflow-y-auto">
                      {citySuggestions.map((loc) => (
                        <button
                          key={`${loc.city}-${loc.pincode}`}
                          type="button"
                          onClick={() => selectLocation(loc)}
                          className="w-full px-4 py-2.5 text-left text-sm text-charcoal hover:bg-cream hover:text-bronze transition-colors cursor-pointer focus-visible:bg-cream focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-bronze"
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
                  <Input
                    id="shippingState"
                    autoComplete="address-level1"
                    {...register("shippingState")}
                  />
                  {errors.shippingState && (
                    <p className="text-xs text-brand-red">{errors.shippingState.message}</p>
                  )}
                </div>

                {/* Pincode with autocomplete */}
                <div
                  className="space-y-2 relative"
                  onBlur={closeOnBlur(setShowPincodeSuggestions)}
                >
                  <Label htmlFor="shippingPincode">Pincode</Label>
                  <Input
                    id="shippingPincode"
                    inputMode="numeric"
                    spellCheck={false}
                    {...register("shippingPincode")}
                    onFocus={() => setShowPincodeSuggestions(true)}
                    autoComplete="off"
                  />
                  {showPincodeSuggestions && pincodeSuggestions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-linen bg-white py-1 shadow-xl max-h-48 overflow-y-auto">
                      {pincodeSuggestions.map((loc) => (
                        <button
                          key={`${loc.city}-${loc.pincode}`}
                          type="button"
                          onClick={() => selectLocation(loc)}
                          className="w-full px-4 py-2.5 text-left text-sm text-charcoal hover:bg-cream hover:text-bronze transition-colors cursor-pointer focus-visible:bg-cream focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-bronze"
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

              {selectedAddressId === null && (
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
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(1)}
              className="rounded-full text-graphite hover:text-charcoal flex items-center gap-2"
            >
              <ArrowLeft aria-hidden="true" size={16} /> Back
            </Button>
            <Button
              type="button"
              onClick={handleNextToPayment}
              className="w-full sm:w-auto rounded-full bg-bronze text-ivory hover:bg-bronze/90 flex items-center justify-center gap-2 px-6 py-3"
            >
              Next: Payment Option <ArrowRight aria-hidden="true" size={16} />
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
            {/* A <label> per option, not a <div onClick>: the label and the
                radio then share one hit target with no dead zones, and the
                keyboard gets native radio-group arrow-key behaviour free. */}
            <fieldset className="space-y-4">
              <legend className="font-heading text-xl text-charcoal">
                Select Payment Option
              </legend>

              <PaymentOption
                value="COD"
                title="Cash on Delivery (COD)"
                blurb="Pay with cash or UPI when your furniture arrives at your doorstep."
                disabledNote="Cash on Delivery is currently disabled."
                allowed={settings.allowCOD}
                selected={paymentMethod === "COD"}
                onSelect={() => setPaymentMethod("COD")}
              />

              <PaymentOption
                value="UPI"
                title="UPI / QR Code Payment"
                blurb="Pay instantly using any UPI app (GPay, PhonePe, Paytm, etc.)."
                disabledNote="UPI Payment is currently disabled."
                allowed={settings.allowUPI}
                selected={paymentMethod === "UPI"}
                onSelect={() => setPaymentMethod("UPI")}
              />
            </fieldset>

            {/* UPI QR */}
            {paymentMethod === "UPI" && settings.allowUPI && (
              <div className="rounded-xl border border-dashed border-bronze/30 bg-cream/20 p-6 flex flex-col items-center justify-center text-center space-y-4">
                <div className="flex items-center gap-2 text-bronze">
                  <QrCode aria-hidden="true" size={20} />
                  <span className="font-heading font-medium">Scan to Pay</span>
                </div>

                {settings.upiQrImage ? (
                  <div className="relative size-48 rounded-lg overflow-hidden border border-linen bg-white p-2 shadow-sm">
                    <img
                      src={settings.upiQrImage}
                      alt="UPI QR code — scan with any UPI app to pay"
                      width={192}
                      height={192}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="size-48 rounded-lg border border-linen bg-linen/20 flex flex-col items-center justify-center text-graphite/40">
                    <QrCode aria-hidden="true" size={40} className="stroke-1 mb-2" />
                    <p className="text-xs px-4">UPI QR Code will be provided by manager</p>
                  </div>
                )}

                {settings.upiId && (
                  <div className="space-y-1">
                    <p className="text-xs text-graphite/60">UPI ID</p>
                    <p
                      translate="no"
                      className="text-sm font-mono font-bold text-charcoal bg-white px-3 py-1.5 rounded-full border border-linen select-all break-all"
                    >
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

          <div aria-live="assertive">
            {serverError && (
              <div
                role="alert"
                className="rounded-lg border border-brand-red/20 bg-brand-red/5 p-3 text-sm font-medium text-brand-red"
              >
                {serverError}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(2)}
              className="rounded-full text-graphite hover:text-charcoal flex items-center gap-2"
            >
              <ArrowLeft aria-hidden="true" size={16} /> Back
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-full bg-bronze text-ivory hover:bg-bronze/90 flex items-center justify-center gap-2 px-8 py-4 text-base shadow-md cursor-pointer"
            >
              {isSubmitting && (
                <Loader2 aria-hidden="true" className="animate-spin" size={16} />
              )}
              {isSubmitting ? "Placing Order…" : `Place Order · ${formatINR(totals.total)}`}
            </Button>
          </div>

          {/*
            DPDP §5 notice at the point of collection. Says the retention part
            out loud because it is the one thing customers are surprised by
            later: a copy of the delivery details is frozen onto the invoice and
            survives account deletion, because tax law requires it.
          */}
          <p className="mt-4 text-xs text-graphite/50">
            We use your delivery details to fulfil this order, and keep a copy on
            the invoice for 8 years as Indian tax law requires. See our{" "}
            <Link href="/privacy" className="underline hover:text-bronze">
              Privacy Notice
            </Link>
            .
          </p>
        </form>
      )}
    </div>
  );
}
