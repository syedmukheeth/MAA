"use client";

import { createContext, useContext } from "react";

/**
 * Whether the storefront is currently selling.
 *
 * AddToCartButton is three components deep from the pages that load settings
 * (ProductInspector -> VariantPicker -> button, and ComboItemsPicker), so this
 * avoids threading one boolean through four component signatures. Defaults to
 * true so anything rendered outside the provider keeps working.
 *
 * Display only — the enforcement lives in addToCart and placeOrder.
 */
const PurchasingContext = createContext(true);

export function PurchasingProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <PurchasingContext value={enabled}>{children}</PurchasingContext>
  );
}

export function usePurchasingEnabled() {
  return useContext(PurchasingContext);
}
