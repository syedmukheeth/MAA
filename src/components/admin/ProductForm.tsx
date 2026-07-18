"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2 } from "lucide-react";
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
import { ROOM_CATEGORIES, CATEGORY_LABELS } from "@/lib/validations/product";
import { slugify } from "@/lib/slugify";
import { createProduct, updateProduct } from "@/actions/products";
import { getProductImageUploadSignature } from "@/actions/upload";
import { ImageUploader } from "@/components/admin/ImageUploader";

export type VariantRow = {
  id?: string;
  name: string;
  woodType: string;
  finish: string;
  size: string;
  priceDelta: string;
  sku: string;
  stock: string;
  lowStockThreshold: string;
};

type ProductDefaults = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  mrp?: string;
  category: (typeof ROOM_CATEGORIES)[number];
  materials: string;
  dimensions: string;
  images: string[];
  variants: VariantRow[];
  featured: boolean;
  isActive?: boolean;
};

const EMPTY_VARIANT: VariantRow = {
  name: "Default",
  woodType: "",
  finish: "",
  size: "",
  priceDelta: "0",
  sku: "",
  stock: "0",
  lowStockThreshold: "3",
};

const EMPTY: ProductDefaults = {
  name: "",
  slug: "",
  description: "",
  price: "",
  category: "LIVING_ROOM",
  materials: "",
  dimensions: "",
  images: [],
  variants: [{ ...EMPTY_VARIANT }],
  featured: false,
};

export function ProductForm({
  defaults = EMPTY,
}: {
  defaults?: ProductDefaults;
}) {
  const router = useRouter();
  const [values, setValues] = useState({ mrp: "", ...defaults });
  const [category, setCategory] = useState(defaults.category);
  const [featured, setFeatured] = useState(defaults.featured);
  const [isActive, setIsActive] = useState(defaults.isActive ?? true);
  // Slug follows the name automatically until the manager edits it by hand.
  const [slugTouched, setSlugTouched] = useState(Boolean(defaults.id));
  const [variants, setVariants] = useState<VariantRow[]>(
    defaults.variants.length > 0 ? defaults.variants : [{ ...EMPTY_VARIANT }]
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(defaults.id);

  function setVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((rows) =>
      rows.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  }

  function addVariant() {
    setVariants((rows) => [
      ...rows,
      { ...EMPTY_VARIANT, name: `Variant ${rows.length + 1}` },
    ]);
  }

  function removeVariant(index: number) {
    setVariants((rows) =>
      rows.length > 1 ? rows.filter((_, i) => i !== index) : rows
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const input = {
      name: values.name,
      slug: values.slug,
      description: values.description,
      price: values.price,
      mrp: values.mrp,
      category,
      materials: values.materials,
      dimensions: values.dimensions,
      images: values.images,
      variants: variants.map((v) => ({
        id: v.id,
        name: v.name,
        woodType: v.woodType || undefined,
        finish: v.finish || undefined,
        size: v.size || undefined,
        priceDelta: v.priceDelta === "" ? 0 : Number(v.priceDelta),
        sku: v.sku || undefined,
        stock: v.stock === "" ? 0 : Number(v.stock),
        lowStockThreshold:
          v.lowStockThreshold === "" ? 3 : Number(v.lowStockThreshold),
      })),
      featured,
      isActive,
    };

    const result = isEdit
      ? await updateProduct(defaults.id!, input)
      : await createProduct(input);

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    router.push("/admin/products");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            required
            placeholder="Oakridge Lounge Chair"
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
            placeholder="oakridge-lounge-chair"
            value={values.slug}
            onChange={(e) => {
              setSlugTouched(true);
              // Light cleanup while typing; full slugify would eat the
              // hyphen as it is being typed.
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
          rows={4}
          value={values.description}
          onChange={(e) =>
            setValues({ ...values, description: e.target.value })
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="price">Selling price (INR)</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            required
            value={values.price}
            onChange={(e) => setValues({ ...values, price: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="mrp">MRP (optional)</Label>
          <Input
            id="mrp"
            type="number"
            min="0"
            step="0.01"
            placeholder="Struck-through price"
            value={values.mrp}
            onChange={(e) => setValues({ ...values, mrp: e.target.value })}
          />
          {Number(values.mrp) > Number(values.price) &&
            Number(values.price) > 0 && (
              <p className="text-xs text-green-600">
                Customers see{" "}
                {Math.round(
                  ((Number(values.mrp) - Number(values.price)) /
                    Number(values.mrp)) *
                    100
                )}
                % off
              </p>
            )}
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as typeof category)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose category" />
            </SelectTrigger>
            <SelectContent>
              {ROOM_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dimensions">Dimensions</Label>
          <Input
            id="dimensions"
            placeholder='72" x 36" x 30"'
            value={values.dimensions}
            onChange={(e) =>
              setValues({ ...values, dimensions: e.target.value })
            }
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label>Variants</Label>
            <p className="text-xs text-muted-foreground">
              First row is the default variant. Price delta is added to the
              base price.
              {isEdit &&
                " Stock for existing variants is managed from the Inventory page."}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addVariant}
          >
            <Plus size={14} className="mr-1" /> Add variant
          </Button>
        </div>

        <div className="space-y-3">
          {variants.map((v, index) => (
            <div
              key={v.id ?? `new-${index}`}
              className="rounded-lg border border-border p-4"
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    required
                    value={v.name}
                    onChange={(e) => setVariant(index, { name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Wood</Label>
                  <Input
                    placeholder="Teak"
                    value={v.woodType}
                    onChange={(e) =>
                      setVariant(index, { woodType: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Finish</Label>
                  <Input
                    placeholder="Natural"
                    value={v.finish}
                    onChange={(e) =>
                      setVariant(index, { finish: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Size</Label>
                  <Input
                    placeholder="3-seater"
                    value={v.size}
                    onChange={(e) => setVariant(index, { size: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Price delta (INR)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={v.priceDelta}
                    onChange={(e) =>
                      setVariant(index, { priceDelta: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">SKU</Label>
                  <Input
                    value={v.sku}
                    onChange={(e) => setVariant(index, { sku: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    {v.id ? "Stock (via Inventory)" : "Initial stock"}
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    disabled={Boolean(v.id)}
                    value={v.stock}
                    onChange={(e) =>
                      setVariant(index, { stock: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Low-stock alert at</Label>
                  <Input
                    type="number"
                    min="0"
                    value={v.lowStockThreshold}
                    onChange={(e) =>
                      setVariant(index, { lowStockThreshold: e.target.value })
                    }
                  />
                </div>
              </div>
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-destructive hover:underline"
                >
                  <Trash2 size={12} /> Remove variant
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="materials">Materials (comma separated)</Label>
        <Input
          id="materials"
          placeholder="Teak, Cotton Upholstery"
          value={values.materials}
          onChange={(e) =>
            setValues({ ...values, materials: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Product images</Label>
        <ImageUploader
          multiple
          value={values.images}
          onChange={(images) => setValues({ ...values, images })}
          getSignature={getProductImageUploadSignature}
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="size-4 rounded border-border"
          />
          Featured on storefront
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 rounded border-border"
          />
          Active (visible and purchasable on the storefront)
        </label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-bronze text-ivory hover:bg-bronze/90 flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 className="animate-spin" size={16} />}
        {submitting
          ? "Saving..."
          : isEdit
            ? "Save Changes"
            : "Create Product"}
      </Button>
    </form>
  );
}
