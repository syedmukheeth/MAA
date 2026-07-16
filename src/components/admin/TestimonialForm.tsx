"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createTestimonial, updateTestimonial } from "@/actions/testimonials";
import { getTestimonialImageUploadSignature } from "@/actions/upload";
import { ImageUploader } from "@/components/admin/ImageUploader";

type TestimonialDefaults = {
  id?: string;
  name: string;
  location: string;
  quote: string;
  rating: number;
  imageUrl: string;
  isPublished: boolean;
  sortOrder: number;
};

const EMPTY: TestimonialDefaults = {
  name: "",
  location: "",
  quote: "",
  rating: 5,
  imageUrl: "",
  isPublished: true,
  sortOrder: 0,
};

export function TestimonialForm({
  defaults = EMPTY,
}: {
  defaults?: TestimonialDefaults;
}) {
  const router = useRouter();
  const [values, setValues] = useState(defaults);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(defaults.id);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const input = {
      name: values.name,
      location: values.location || undefined,
      quote: values.quote,
      rating: Number(values.rating),
      imageUrl: values.imageUrl || undefined,
      isPublished: values.isPublished,
      sortOrder: Number(values.sortOrder),
    };

    const result = isEdit
      ? await updateTestimonial(defaults.id!, input)
      : await createTestimonial(input);

    if (result?.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    router.push("/admin/testimonials");
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Customer Name</Label>
          <Input
            id="name"
            required
            value={values.name}
            onChange={(e) => setValues({ ...values, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location (optional)</Label>
          <Input
            id="location"
            placeholder="e.g. Hyderabad, Kurnool"
            value={values.location}
            onChange={(e) => setValues({ ...values, location: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rating">Rating (1 to 5 Stars)</Label>
          <Input
            id="rating"
            type="number"
            min="1"
            max="5"
            required
            value={values.rating}
            onChange={(e) => setValues({ ...values, rating: Number(e.target.value) || 5 })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sortOrder">Sort Order</Label>
          <Input
            id="sortOrder"
            type="number"
            min="0"
            required
            value={values.sortOrder}
            onChange={(e) => setValues({ ...values, sortOrder: Number(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quote">Customer Quote</Label>
        <Textarea
          id="quote"
          required
          rows={4}
          placeholder="What did the customer say about MAA FURNITURE?"
          value={values.quote}
          onChange={(e) => setValues({ ...values, quote: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Customer Photo (optional)</Label>
        <ImageUploader
          value={values.imageUrl ? [values.imageUrl] : []}
          onChange={(urls) => setValues({ ...values, imageUrl: urls[0] ?? "" })}
          getSignature={getTestimonialImageUploadSignature}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={values.isPublished}
          onChange={(e) => setValues({ ...values, isPublished: e.target.checked })}
          className="size-4 rounded border-border"
        />
        Publish directly to storefront homepage
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-bronze text-ivory hover:bg-bronze/90"
      >
        {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Testimonial"}
      </Button>
    </form>
  );
}
