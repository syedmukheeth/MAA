"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Search, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/slugify";
import { createCombo, updateCombo } from "@/actions/combos";
import { getComboImageUploadSignature } from "@/actions/upload";
import { ImageUploader } from "@/components/admin/ImageUploader";

export type ComboProductOption = {
  id: string;
  name: string;
  variants: {
    id: string;
    name: string;
    woodType: string | null;
    finish: string | null;
    size: string | null;
  }[];
};

type ComboItemDraft = {
  productId: string;
  quantity: number;
  optionVariantIds: string[];
};

type ComboDefaults = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  bundlePrice: string;
  image: string;
  isActive: boolean;
  items: ComboItemDraft[];
};

const EMPTY: ComboDefaults = {
  name: "",
  slug: "",
  description: "",
  bundlePrice: "",
  image: "",
  isActive: true,
  items: [
    { productId: "", quantity: 1, optionVariantIds: [] },
    { productId: "", quantity: 1, optionVariantIds: [] },
  ],
};

function variantLabel(v: ComboProductOption["variants"][number]) {
  const detail = [v.woodType, v.finish, v.size].filter(Boolean).join(" / ");
  return detail ? `${v.name} (${detail})` : v.name;
}

/** Text-filterable product picker: type to search the catalog. */
function ProductCombobox({
  products,
  value,
  onSelect,
}: {
  products: ComboProductOption[];
  value: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = products.find((p) => p.id === value);
  const q = query.trim().toLowerCase();
  const matches = q
    ? products.filter((p) => p.name.toLowerCase().includes(q))
    : products;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-transparent px-3 text-left text-sm"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected?.name ?? "Choose product"}
        </span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-background shadow-lg">
          <div className="relative border-b border-border">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="h-9 w-full bg-transparent pl-9 pr-3 text-sm outline-none"
            />
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {matches.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(p.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-muted ${
                    p.id === value ? "text-bronze" : "text-foreground"
                  }`}
                >
                  {p.name}
                </button>
              </li>
            ))}
            {matches.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                No products match &quot;{query}&quot;.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ComboForm({
  products,
  defaults = EMPTY,
}: {
  products: ComboProductOption[];
  defaults?: ComboDefaults;
}) {
  const router = useRouter();
  const [values, setValues] = useState(defaults);
  const [slugTouched, setSlugTouched] = useState(Boolean(defaults.id));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(defaults.id);

  function updateItem(index: number, patch: Partial<ComboItemDraft>) {
    setValues((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  }

  function toggleOption(index: number, variantId: string) {
    setValues((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => {
        if (i !== index) return it;
        const has = it.optionVariantIds.includes(variantId);
        return {
          ...it,
          optionVariantIds: has
            ? it.optionVariantIds.filter((v) => v !== variantId)
            : [...it.optionVariantIds, variantId],
        };
      }),
    }));
  }

  function addItem() {
    setValues((prev) => ({
      ...prev,
      items: [...prev.items, { productId: "", quantity: 1, optionVariantIds: [] }],
    }));
  }

  function removeItem(index: number) {
    setValues((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const input = {
      name: values.name,
      slug: values.slug,
      description: values.description,
      bundlePrice: values.bundlePrice,
      image: values.image,
      isActive: values.isActive,
      items: values.items,
    };

    const result = isEdit
      ? await updateCombo(defaults.id!, input)
      : await createCombo(input);

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    router.push("/admin/combos");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            required
            value={values.name}
            onChange={(e) =>
              setValues({
                ...values,
                name: e.target.value,
                slug: slugTouched ? values.slug : slugify(e.target.value),
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">
            URL slug{" "}
            <span className="text-xs font-normal text-muted-foreground">
              (auto-generated from name)
            </span>
          </Label>
          <Input
            id="slug"
            required
            placeholder="living-room-set"
            value={values.slug}
            onChange={(e) => {
              setSlugTouched(true);
              setValues({
                ...values,
                slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
              });
            }}
            onBlur={() => setValues((v) => ({ ...v, slug: slugify(v.slug) }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          required
          rows={3}
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bundlePrice">Bundle price (INR)</Label>
          <Input
            id="bundlePrice"
            type="number"
            min="0"
            step="0.01"
            required
            value={values.bundlePrice}
            onChange={(e) => setValues({ ...values, bundlePrice: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Combo image</Label>
          <ImageUploader
            value={values.image ? [values.image] : []}
            onChange={(urls) => setValues({ ...values, image: urls[0] ?? "" })}
            getSignature={getComboImageUploadSignature}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Products in this combo</Label>
          <p className="text-xs text-muted-foreground">
            Tick the variants a customer may choose for each product. Leave all
            unticked for a fixed item (customer sees no options).
          </p>
        </div>
        {values.items.map((item, i) => {
          const product = products.find((p) => p.id === item.productId);
          return (
            <div key={i} className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center gap-3">
                <ProductCombobox
                  products={products}
                  value={item.productId}
                  onSelect={(id) =>
                    updateItem(i, { productId: id, optionVariantIds: [] })
                  }
                />
                <Input
                  type="number"
                  min="1"
                  className="w-20"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(i, { quantity: Number(e.target.value) || 1 })
                  }
                />
                <button
                  type="button"
                  onClick={() => removeItem(i)}
                  disabled={values.items.length <= 2}
                  className="rounded-md p-2 text-graphite/60 hover:text-brand-red disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {product && product.variants.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    Customer-selectable options
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {product.variants.map((v) => (
                      <label
                        key={v.id}
                        className="flex items-center gap-1.5 text-xs text-foreground"
                      >
                        <input
                          type="checkbox"
                          checked={item.optionVariantIds.includes(v.id)}
                          onChange={() => toggleOption(i, v.id)}
                          className="size-3.5 rounded border-border"
                        />
                        {variantLabel(v)}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-2 text-sm text-bronze"
        >
          <Plus size={16} /> Add another product
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => setValues({ ...values, isActive: e.target.checked })}
          className="size-4 rounded border-border"
        />
        Active on storefront
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-bronze text-ivory hover:bg-bronze/90 flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="animate-spin" size={16} />}
        {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create Combo"}
      </Button>
    </form>
  );
}
