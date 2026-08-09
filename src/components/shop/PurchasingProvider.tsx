"use client";

import { createContext, useContext } from "react";

/**
 * Whether the storefront is currently selling, and why not when it isn't.
 *
 * AddToCartButton is three components deep from the pages that load settings
 * (ProductInspector -> VariantPicker -> button, and ComboItemsPicker), so this
 * avoids threading the state through four component signatures. Defaults to
 * enabled so anything rendered outside the provider keeps working.
 *
 * Two things can switch buying off: the owner's `allowPurchases` toggle, and
 * the viewer being staff — hence the message travels with the flag instead of
 * each consumer guessing which one applies.
 *
 * Display only — the enforcement lives in addToCart and placeOrder.
 */
type PurchasingState = { enabled: boolean; disabledMessage: string | null };

const PurchasingContext = createContext<PurchasingState>({
  enabled: true,
  disabledMessage: null,
});

export function PurchasingProvider({
  enabled,
  disabledMessage = null,
  children,
}: {
  enabled: boolean;
  disabledMessage?: string | null;
  children: React.ReactNode;
}) {
  return (
    <PurchasingContext value={{ enabled, disabledMessage }}>
      {children}
    </PurchasingContext>
  );
}

export function usePurchasing() {
  return useContext(PurchasingContext);
}

export function usePurchasingEnabled() {
  return useContext(PurchasingContext).enabled;
}
