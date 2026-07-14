"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { createProduct, updateProduct } from "@/actions/products";
import { getProductImageUploadSignature } from "@/actions/upload";
import { ImageUploader } from "@/components/admin/ImageUploader";

type ProductDefaults = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  category: (typeof ROOM_CATEGORIES)[number];
  materials: string;
  dimensions: string;
  images: string[];
  stockQuantity: string;
  lowStockThreshold: string;
  featured: boolean;
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
  stockQuantity: "0",
  lowStockThreshold: "5",
  featured: false,
};

export function ProductForm({
  defaults = EMPTY,
}: {
  defaults?: ProductDefaults;
}) {
  const router = useRouter();
  const [values, setValues] = useState(defaults);
  const [category, setCategory] = useState(defaults.category);
  const [featured, setFeatured] = useState(defaults.featured);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(defaults.id);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const input = {
      name: values.name,
      slug: values.slug,
      description: values.description,
      price: values.price,
      category,
      materials: values.materials,
      dimensions: values.dimensions,
      images: values.images,
      stockQuantity: values.stockQuantity,
      lowStockThreshold: values.lowStockThreshold,
      featured,
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
            placeholder="oakridge-lounge-chair"
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
          rows={4}
          value={values.description}
          onChange={(e) =>
            setValues({ ...values, description: e.target.value })
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="price">Price (INR)</Label>
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="stockQuantity">Stock quantity</Label>
          <Input
            id="stockQuantity"
            type="number"
            min="0"
            required
            value={values.stockQuantity}
            onChange={(e) =>
              setValues({ ...values, stockQuantity: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lowStockThreshold">Low stock threshold</Label>
          <Input
            id="lowStockThreshold"
            type="number"
            min="0"
            required
            value={values.lowStockThreshold}
            onChange={(e) =>
              setValues({ ...values, lowStockThreshold: e.target.value })
            }
          />
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

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={featured}
          onChange={(e) => setFeatured(e.target.checked)}
          className="size-4 rounded border-border"
        />
        Featured on storefront
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-bronze text-ivory hover:bg-bronze/90"
      >
        {submitting
          ? "Saving..."
          : isEdit
            ? "Save Changes"
            : "Create Product"}
      </Button>
    </form>
  );
}
