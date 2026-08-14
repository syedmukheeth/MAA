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
  subjectUserId: string;
  /** Whether the linked customer has already consented in their own account. */
  hasSubjectConsent: boolean;
};

/** Minimal shape for the customer picker — no phone, no address, no order history. */
export type CustomerOption = { id: string; name: string; email: string };

const EMPTY: TestimonialDefaults = {
  name: "",
  location: "",
  quote: "",
  rating: 5,
  imageUrl: "",
  // Unpublished by default. Publishing names a real person on the homepage and
  // needs their consent first, so the safe default is a draft.
  isPublished: false,
  sortOrder: 0,
  subjectUserId: "",
  hasSubjectConsent: false,
};

export function TestimonialForm({
  defaults = EMPTY,
  customers = [],
}: {
  defaults?: TestimonialDefaults;
  customers?: CustomerOption[];
}) {
  const router = useRouter();
  const [values, setValues] = useState(defaults);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = Boolean(defaults.id);

  // Whether publishing is currently permitted, mirrored from the server rule in
  // resolvePublishConsent(). The server is still the authority — this only
  // stops staff filling in a form that is going to be rejected.
  const linkedCustomerConsented =
    values.subjectUserId === defaults.subjectUserId && defaults.hasSubjectConsent;
  const [offlineConsent, setOfflineConsent] = useState(false);
  const canPublish =
    Boolean(values.subjectUserId) && (linkedCustomerConsented || offlineConsent);

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
      subjectUserId: values.subjectUserId || undefined,
      offlineConsentRecorded: offlineConsent,
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
          <Label htmlFor="location">City (optional)</Label>
          <Input
            id="location"
            maxLength={40}
            placeholder="e.g. Kurnool"
            value={values.location}
            onChange={(e) => setValues({ ...values, location: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            City only — not an area or a street. This is published next to the
            customer&apos;s name and photo.
          </p>
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

      {/*
        Consent block. Publishing a named person's quote, city and photograph is
        one of only two things this site does that runs on consent (DPDP §6) —
        there is no contract to perform and nothing the customer gains, so no
        other lawful basis is available. The server enforces this in
        resolvePublishConsent(); this section exists so staff can see why the
        publish box is disabled rather than hitting an error.
      */}
      <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
        <div className="space-y-2">
          <Label htmlFor="subjectUserId">Customer account</Label>
          <select
            id="subjectUserId"
            value={values.subjectUserId}
            onChange={(e) =>
              setValues({ ...values, subjectUserId: e.target.value })
            }
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Not linked (walk-in customer)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.email}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Linking lets the customer withdraw consent themselves, and lets us
            take this down automatically if they ask us to delete their data.
          </p>
        </div>

        {values.subjectUserId && !linkedCustomerConsented && (
          <label className="flex items-start gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={offlineConsent}
              onChange={(e) => setOfflineConsent(e.target.checked)}
              className="mt-0.5 size-4 rounded border-border"
            />
            <span>
              I confirm this customer agreed, in person or in writing, to us
              publishing their name, photo and review on our website.
              <span className="block text-xs text-muted-foreground">
                This records a consent entry against their account under your
                name.
              </span>
            </span>
          </label>
        )}

        {linkedCustomerConsented && (
          <p className="text-xs text-muted-foreground">
            This customer has granted publication consent in their own account.
          </p>
        )}

        <label className="flex items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={values.isPublished}
            disabled={!canPublish}
            onChange={(e) =>
              setValues({ ...values, isPublished: e.target.checked })
            }
            className="mt-0.5 size-4 rounded border-border disabled:opacity-40"
          />
          <span className={canPublish ? "" : "text-muted-foreground"}>
            Publish to the storefront homepage
            {!canPublish && (
              <span className="block text-xs">
                Link a customer account and record their consent first. You can
                still save this as an unpublished draft.
              </span>
            )}
          </span>
        </label>
      </div>

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
