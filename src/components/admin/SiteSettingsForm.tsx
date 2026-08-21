"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateSiteSettings } from "@/actions/site-settings";
import type { SiteSettings } from "@/lib/site-settings";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { getProductImageUploadSignature } from "@/actions/upload";
import { ROOM_CATEGORIES, CATEGORY_LABELS } from "@/lib/validations/product";
import { X, Plus } from "lucide-react";

/* ─── Reusable tag-list editor ─────────────────────────────── */
function TagListEditor({
  label,
  hint,
  items,
  onChange,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function addItem() {
    const v = draft.trim();
    if (v && !items.includes(v)) {
      onChange([...items, v]);
    }
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1.5 rounded-full bg-secondary border border-border px-3 py-1 text-sm text-foreground"
          >
            {item}
            <button
              type="button"
              onClick={() => onChange(items.filter((i) => i !== item))}
              className="text-muted-foreground hover:text-brand-red transition-colors"
              aria-label={`Remove ${item}`}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder="Type and press Enter or Add"
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addItem} className="shrink-0">
          <Plus size={14} className="mr-1" /> Add
        </Button>
      </div>
    </div>
  );
}

/* ─── Helper: JSON-serialise list ──────────────────────────── */
function toJson(items: string[]): string | null {
  return items.length === 0 ? null : JSON.stringify(items);
}
function fromJson(raw: string | null, fallback: string[]): string[] {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

/* ─── Reusable two-field list editor ───────────────────────────
   Backs the "Why Choose Us" badges and the showroom FAQ. Both were hardcoded
   arrays in their components, publishing warranty terms and lead times the
   business had never agreed to; an empty list here hides the section entirely,
   which is the correct state until the owner writes their own. */
type Pair = { a: string; b: string };

function pairsFromJson(raw: string | null, keyA: string, keyB: string): Pair[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => p && typeof p === "object")
      .map((p) => ({
        a: typeof p[keyA] === "string" ? p[keyA] : "",
        b: typeof p[keyB] === "string" ? p[keyB] : "",
      }));
  } catch {
    return [];
  }
}

function pairsToJson(pairs: Pair[], keyA: string, keyB: string): string | null {
  const cleaned = pairs.filter((p) => p.a.trim() !== "");
  return cleaned.length === 0
    ? null
    : JSON.stringify(cleaned.map((p) => ({ [keyA]: p.a.trim(), [keyB]: p.b.trim() })));
}

function PairListEditor({
  pairs,
  labelA,
  labelB,
  addLabel,
  multilineB = true,
  onChange,
}: {
  pairs: Pair[];
  labelA: string;
  labelB: string;
  addLabel: string;
  multilineB?: boolean;
  onChange: (pairs: Pair[]) => void;
}) {
  function update(index: number, patch: Partial<Pair>) {
    onChange(pairs.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  return (
    <div className="space-y-4">
      {pairs.map((pair, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex items-center gap-2">
            <Input
              value={pair.a}
              placeholder={labelA}
              onChange={(e) => update(i, { a: e.target.value })}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label={`Remove ${pair.a || labelA}`}
              onClick={() => onChange(pairs.filter((_, index) => index !== i))}
              className="shrink-0"
            >
              <X size={14} />
            </Button>
          </div>
          {multilineB ? (
            <Textarea
              rows={2}
              value={pair.b}
              placeholder={labelB}
              onChange={(e) => update(i, { b: e.target.value })}
            />
          ) : (
            <Input
              value={pair.b}
              placeholder={labelB}
              onChange={(e) => update(i, { b: e.target.value })}
            />
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...pairs, { a: "", b: "" }])}
      >
        <Plus size={14} className="mr-1" /> {addLabel}
      </Button>
    </div>
  );
}

/* ─── Custom Studio Features ────────────────────────────────── */
type StudioFeature = { label: string; options: string[] };

function fromFeatureJson(raw: string | null): StudioFeature[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((f) => f && typeof f.label === "string")
      .map((f) => ({
        label: f.label,
        options: Array.isArray(f.options) ? f.options.filter((o: unknown) => typeof o === "string") : [],
      }));
  } catch {
    return [];
  }
}

function toFeatureJson(features: StudioFeature[]): string | null {
  const cleaned = features.filter((f) => f.label.trim().length > 0);
  return cleaned.length === 0 ? null : JSON.stringify(cleaned);
}

function FeatureListEditor({
  features,
  onChange,
}: {
  features: StudioFeature[];
  onChange: (features: StudioFeature[]) => void;
}) {
  function updateFeature(index: number, next: Partial<StudioFeature>) {
    onChange(features.map((f, i) => (i === index ? { ...f, ...next } : f)));
  }

  return (
    <div className="space-y-4">
      {features.map((feature, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-border bg-background/50 p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1 space-y-2">
              <Label>Feature name</Label>
              <Input
                value={feature.label}
                onChange={(e) => updateFeature(i, { label: e.target.value })}
                placeholder="e.g. Handle Style"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange(features.filter((_, idx) => idx !== i))}
              className="shrink-0 text-brand-red hover:text-brand-red"
            >
              <X size={14} className="mr-1" /> Remove
            </Button>
          </div>
          <TagListEditor
            label="Options"
            hint="Choices customers can pick for this feature"
            items={feature.options}
            onChange={(items) => updateFeature(i, { options: items })}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...features, { label: "", options: [] }])}
      >
        <Plus size={14} className="mr-1" /> Add Feature
      </Button>
    </div>
  );
}

const DEFAULT_WOODS = ["Teak", "Sheesham", "Oak", "Walnut", "Mango Wood"];
const DEFAULT_FINISHES = ["Matte", "Satin", "High Gloss", "Natural Oil"];
const DEFAULT_BUDGETS = ["Under ₹50,000", "₹50,000 – ₹1,50,000", "₹1,50,000 – ₹5,00,000", "₹5,00,000+"];

export function SiteSettingsForm({
  defaults,
  canEditCommerce,
}: {
  defaults: SiteSettings;
  /**
   * OWNER/ADMIN only. A MANAGER may edit shop content but not the tax rate,
   * delivery fees or the UPI account the money lands in — the server drops
   * those fields from a MANAGER's save, and this greys them out so the refusal
   * is visible before they type into it.
   */
  canEditCommerce: boolean;
}) {
  const [values, setValues] = useState({
    ...defaults,
    showroomPhone: defaults.showroomPhone ?? "",
    showroomWhatsapp: defaults.showroomWhatsapp ?? "",
    instagramUrl: defaults.instagramUrl ?? "",
    facebookUrl: defaults.facebookUrl ?? "",
    contactEmail: defaults.contactEmail ?? "",
    mapsUrl: defaults.mapsUrl ?? "",
    studioImageUrl: defaults.studioImageUrl ?? "",
    gstRate: defaults.gstRate ?? "18",
    deliveryFee: defaults.deliveryFee ?? "0",
    freeDeliveryThreshold: defaults.freeDeliveryThreshold ?? "",
    allowPurchases: defaults.allowPurchases ?? true,
    allowCOD: defaults.allowCOD ?? true,
    allowUPI: defaults.allowUPI ?? true,
    upiId: defaults.upiId ?? "",
    upiQrImage: defaults.upiQrImage ?? "",
    shopSections: defaults.shopSections ?? null,
    shopCustomSections: defaults.shopCustomSections ?? null,
    studioWoods: defaults.studioWoods ?? null,
    studioFinishes: defaults.studioFinishes ?? null,
    studioBudgets: defaults.studioBudgets ?? null,
    studioFeatures: defaults.studioFeatures ?? null,
    trustBadges: defaults.trustBadges ?? null,
    faqItems: defaults.faqItems ?? null,
  });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Derived list state for UI (decoded from JSON strings)
  const enabledSections = fromJson(values.shopSections, [...ROOM_CATEGORIES]);
  const customSections = fromJson(values.shopCustomSections, []);
  const studioWoods = fromJson(values.studioWoods, DEFAULT_WOODS);
  const studioFinishes = fromJson(values.studioFinishes, DEFAULT_FINISHES);
  const studioBudgets = fromJson(values.studioBudgets, DEFAULT_BUDGETS);
  const studioFeatures = fromFeatureJson(values.studioFeatures);
  const trustBadges = pairsFromJson(values.trustBadges, "title", "body");
  const faqItems = pairsFromJson(values.faqItems, "question", "answer");

  function set<K extends keyof typeof values>(key: K, val: (typeof values)[K]) {
    setValues((v) => ({ ...v, [key]: val }));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);
    const result = await updateSiteSettings(values);
    setSubmitting(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setNotice(result?.notice ?? null);
    setSaved(true);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-10">
      <section className="space-y-4">
        <h2 className="font-heading text-lg text-foreground">Hero Section</h2>
        <div className="space-y-2">
          <Label>Headline</Label>
          <Textarea
            rows={2}
            value={values.heroHeadline}
            onChange={(e) => set("heroHeadline", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Subtext</Label>
          <Textarea
            rows={2}
            value={values.heroSubtext}
            onChange={(e) => set("heroSubtext", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Background image</Label>
          {/* Upload rather than a URL box: pasting a link meant finding a host
              first, and the CSP only allows images served from Cloudinary, so a
              link to anywhere else silently fails to render. */}
          <ImageUploader
            multiple={false}
            value={values.heroImageUrl ? [values.heroImageUrl] : []}
            onChange={(images) => set("heroImageUrl", images[0] ?? "")}
            getSignature={getProductImageUploadSignature}
          />
          <p className="text-xs text-muted-foreground">
            The full-screen photo behind the headline on the homepage. Leave it
            empty and the section shows a plain dark background instead.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg text-foreground">Brand Statement</h2>
        <div className="space-y-2">
          <Label>Label</Label>
          <Input
            value={values.brandLabel}
            onChange={(e) => set("brandLabel", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Headline</Label>
          <Textarea
            rows={2}
            value={values.brandHeadline}
            onChange={(e) => set("brandHeadline", e.target.value)}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg text-foreground">Trust Stats</h2>
        <p className="text-xs text-muted-foreground">
          Each figure is published on the homepage as a statement about your
          business. Leave a field at 0 or empty and that tile is hidden — only
          fill in numbers you can stand behind.
        </p>
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Years of experience</Label>
            <Input
              type="number"
              value={values.statYearsExperience}
              onChange={(e) => set("statYearsExperience", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Projects delivered</Label>
            <Input
              type="number"
              value={values.statProjectsDelivered}
              onChange={(e) => set("statProjectsDelivered", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Happy families</Label>
            <Input
              type="number"
              value={values.statHappyFamilies}
              onChange={(e) => set("statHappyFamilies", Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Google rating</Label>
            <Input
              value={values.statGoogleRating}
              onChange={(e) => set("statGoogleRating", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg text-foreground">Showroom & Contact</h2>
        <div className="space-y-2">
          <Label>Address</Label>
          <Textarea
            rows={2}
            value={values.showroomAddress}
            onChange={(e) => set("showroomAddress", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Hours</Label>
          <Input
            value={values.showroomHours}
            onChange={(e) => set("showroomHours", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Phone (with country code)</Label>
            <Input
              placeholder="+919876543210"
              value={values.showroomPhone}
              onChange={(e) => set("showroomPhone", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp number (with country code)</Label>
            <Input
              placeholder="+919876543210"
              value={values.showroomWhatsapp}
              onChange={(e) => set("showroomWhatsapp", e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Instagram URL</Label>
            <Input
              value={values.instagramUrl}
              onChange={(e) => set("instagramUrl", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Facebook URL</Label>
            <Input
              value={values.facebookUrl}
              onChange={(e) => set("facebookUrl", e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Contact email</Label>
            <Input
              type="email"
              placeholder="hello@yourdomain.com"
              value={values.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Shown in the footer and on the showroom page. Empty hides the email
              link.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Google Maps link</Label>
            <Input
              placeholder="https://maps.app.goo.gl/..."
              value={values.mapsUrl}
              onChange={(e) => set("mapsUrl", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Empty falls back to a directions search built from the address
              above.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg text-foreground">Why Choose Us</h2>
        <p className="text-xs text-muted-foreground">
          Published on the homepage as your own commitments. Anything you write
          here — a warranty, a guarantee — is a promise customers can hold you to,
          so leave the list empty rather than filling it with placeholders. An
          empty list hides the section.
        </p>
        <PairListEditor
          pairs={trustBadges}
          labelA="Title, e.g. Genuine Materials"
          labelB="Short description"
          addLabel="Add Point"
          onChange={(pairs) => set("trustBadges", pairsToJson(pairs, "title", "body"))}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg text-foreground">Showroom FAQ</h2>
        <p className="text-xs text-muted-foreground">
          Shown on /showroom. Same rule as above: delivery times, warranty terms
          and return policies written here are what customers will rely on. An
          empty list hides the section.
        </p>
        <PairListEditor
          pairs={faqItems}
          labelA="Question"
          labelB="Answer"
          addLabel="Add Question"
          onChange={(pairs) => set("faqItems", pairsToJson(pairs, "question", "answer"))}
        />
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg text-foreground">Delivery Coverage</h2>
        <div className="space-y-2">
          <Label>Delivery message (shown on homepage)</Label>
          <Input
            placeholder="Delivery in Andhra Pradesh Only"
            value={values.deliveryMessage}
            onChange={(e) => set("deliveryMessage", e.target.value)}
          />
        </div>
      </section>

      <fieldset disabled={!canEditCommerce} className="space-y-10 disabled:opacity-60">
      {!canEditCommerce && (
        <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          Pricing and payment settings are owner/admin only. Ask an owner to
          change the GST rate, delivery fees or the UPI account.
        </p>
      )}

      <section className="space-y-4">
        <h2 className="font-heading text-lg text-foreground">Tax & Delivery Settings</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="gstRate">GST Rate (%)</Label>
            <Input
              id="gstRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              required
              value={values.gstRate}
              onChange={(e) => set("gstRate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliveryFee">Delivery Fee (INR)</Label>
            <Input
              id="deliveryFee"
              type="number"
              min="0"
              step="0.01"
              required
              value={values.deliveryFee}
              onChange={(e) => set("deliveryFee", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="freeDeliveryThreshold">Free Delivery Threshold (INR, optional)</Label>
            <Input
              id="freeDeliveryThreshold"
              type="number"
              min="0"
              step="0.01"
              placeholder="No free threshold"
              value={values.freeDeliveryThreshold}
              onChange={(e) => set("freeDeliveryThreshold", e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg text-foreground">Payment Settings</h2>

        <label className="flex items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={values.allowPurchases}
            onChange={(e) => set("allowPurchases", e.target.checked)}
            className="mt-0.5 size-4 rounded border-border"
          />
          <span>
            Allow customers to buy
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Untick to run the site as a catalogue: products stay visible, but
              add-to-cart and checkout are refused and shoppers are told to call
              instead.
            </span>
          </span>
        </label>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              disabled={!values.allowPurchases}
              checked={values.allowCOD}
              onChange={(e) => set("allowCOD", e.target.checked)}
              className="size-4 rounded border-border"
            />
            Allow Cash on Delivery (COD)
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              disabled={!values.allowPurchases}
              checked={values.allowUPI}
              onChange={(e) => set("allowUPI", e.target.checked)}
              className="size-4 rounded border-border"
            />
            Allow UPI / QR Code Payments
          </label>
        </div>

        {values.allowUPI && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-2">
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                placeholder="e.g. business@upi"
                value={values.upiId}
                onChange={(e) => set("upiId", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>UPI QR Code Image (Empty = None)</Label>
              <ImageUploader
                multiple={false}
                value={values.upiQrImage ? [values.upiQrImage] : []}
                onChange={(images) => set("upiQrImage", images[0] ?? "")}
                getSignature={getProductImageUploadSignature}
              />
            </div>
          </div>
        )}
      </section>
      </fieldset>

      {/* ─── Shop Sections (item 4) ─────────────────── */}
      <section className="space-y-4 rounded-xl border border-border bg-muted/30 p-5">
        <div>
          <h2 className="font-heading text-lg text-foreground">Shop Category Sections</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Choose which room categories appear as filter pills in the shop. Remove a category to hide it from customers.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {ROOM_CATEGORIES.map((cat) => {
            const isEnabled = enabledSections.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  const next = isEnabled
                    ? enabledSections.filter((c) => c !== cat)
                    : [...enabledSections, cat];
                  // If all selected, store null (show all = default)
                  const allSelected = ROOM_CATEGORIES.every((c) => next.includes(c));
                  set("shopSections", allSelected ? null : toJson(next));
                }}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                  isEnabled
                    ? "border-bronze bg-bronze text-ivory"
                    : "border-border bg-secondary text-muted-foreground hover:border-bronze/50"
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          {enabledSections.length === ROOM_CATEGORIES.length
            ? "All categories are shown (default)"
            : `Showing: ${enabledSections.map((c) => CATEGORY_LABELS[c as (typeof ROOM_CATEGORIES)[number]]).join(", ")}`}
        </p>

        <div className="border-t border-border pt-4">
          <TagListEditor
            label="Custom Sections"
            hint="Add extra shop filter pills beyond the fixed room categories. Each links to a product search for that name."
            items={customSections}
            onChange={(items) => set("shopCustomSections", toJson(items))}
          />
        </div>
      </section>

      {/* ─── Custom Studio Options (item 7) ─────────── */}
      <section className="space-y-6 rounded-xl border border-border bg-muted/30 p-5">
        <div>
          <h2 className="font-heading text-lg text-foreground">Custom Studio Options</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Edit the dropdown options shown in the Custom Furniture Studio request form.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Studio image</Label>
          <ImageUploader
            multiple={false}
            value={values.studioImageUrl ? [values.studioImageUrl] : []}
            onChange={(images) => set("studioImageUrl", images[0] ?? "")}
            getSignature={getProductImageUploadSignature}
          />
          <p className="text-xs text-muted-foreground">
            Shown beside the Custom Studio pitch on the homepage and on
            /custom-studio. Empty hides the image frame.
          </p>
        </div>

        <TagListEditor
          label="Wood Types"
          hint="Woods customers can choose from"
          items={studioWoods}
          onChange={(items) => set("studioWoods", toJson(items))}
        />
        <TagListEditor
          label="Finish Options"
          hint="Finish types customers can select"
          items={studioFinishes}
          onChange={(items) => set("studioFinishes", toJson(items))}
        />
        <TagListEditor
          label="Budget Ranges"
          hint="Budget ranges shown in the studio form"
          items={studioBudgets}
          onChange={(items) => set("studioBudgets", toJson(items))}
        />

        <div className="space-y-3 border-t border-border pt-5">
          <div>
            <Label>Custom Features</Label>
            <p className="text-xs text-muted-foreground mt-1">
              Add your own dropdown features (with their own options) to the studio request form.
            </p>
          </div>
          <FeatureListEditor
            features={studioFeatures}
            onChange={(features) => set("studioFeatures", toFeatureJson(features))}
          />
        </div>
      </section>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && !notice && <p className="text-sm text-emerald-500">Saved.</p>}
      {notice && <p className="text-sm text-amber-500">{notice}</p>}

      <Button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-bronze text-ivory hover:bg-bronze/90"
      >
        {submitting ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}
