"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCombo, updateCombo } from "@/actions/combos";
import { getComboImageUploadSignature } from "@/actions/upload";
import { ImageUploader } from "@/components/admin/ImageUploader";

type ProductOption = { id: string; name: string };

type ComboDefaults = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  bundlePrice: string;
  image: string;
  isActive: boolean;
  items: { productId: string; quantity: number }[];
};

const EMPTY: ComboDefaults = {
  name: "",
  slug: "",
  description: "",
  bundlePrice: "",
  image: "",
  isActive: true,
  items: [
    { productId: "", quantity: 1 },
    { productId: "", quantity: 1 },
  ],
};

export function ComboForm({
  products,
  defaults = EMPTY,
}: {
  products: ProductOption[];
  defaults?: ComboDefaults;
}) {
  const router = useRouter();
  const [values, setValues] = useState(defaults);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(defaults.id);

  function updateItem(index: number, patch: Partial<{ productId: string; quantity: number }>) {
    setValues((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    }));
  }

  function addItem() {
    setValues((prev) => ({
      ...prev,
      items: [...prev.items, { productId: "", quantity: 1 }],
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
            onChange={(e) => setValues({ ...values, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            required
            placeholder="living-room-set"
            value={values.slug}
            onChange={(e) => setValues({ ...values, slug: e.target.value })}
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
        <Label>Products in this combo</Label>
        {values.items.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <Select
              value={item.productId}
              onValueChange={(v) => updateItem(i, { productId: v ?? "" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        ))}
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
        className="rounded-full bg-bronze text-ivory hover:bg-bronze/90"
      >
        {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create Combo"}
      </Button>
    </form>
  );
}
