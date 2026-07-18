"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateSiteSettings } from "@/actions/site-settings";
import type { SiteSettings } from "@/lib/site-settings";

export function SiteSettingsForm({ defaults }: { defaults: SiteSettings }) {
  const [values, setValues] = useState({
    ...defaults,
    showroomPhone: defaults.showroomPhone ?? "",
    showroomWhatsapp: defaults.showroomWhatsapp ?? "",
    instagramUrl: defaults.instagramUrl ?? "",
    facebookUrl: defaults.facebookUrl ?? "",
    gstRate: defaults.gstRate ?? "18",
    deliveryFee: defaults.deliveryFee ?? "0",
    freeDeliveryThreshold: defaults.freeDeliveryThreshold ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof typeof values>(key: K, val: (typeof values)[K]) {
    setValues((v) => ({ ...v, [key]: val }));
    setSaved(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await updateSiteSettings(values);
    setSubmitting(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
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
          <Label>Background image URL</Label>
          <Input
            value={values.heroImageUrl}
            onChange={(e) => set("heroImageUrl", e.target.value)}
          />
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
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Years of experience</Label>
            <Input
              type="number"
              value={values.statYearsExperience}
              onChange={(e) =>
                set("statYearsExperience", Number(e.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Projects delivered</Label>
            <Input
              type="number"
              value={values.statProjectsDelivered}
              onChange={(e) =>
                set("statProjectsDelivered", Number(e.target.value))
              }
            />
          </div>
          <div className="space-y-2">
            <Label>Happy families</Label>
            <Input
              type="number"
              value={values.statHappyFamilies}
              onChange={(e) =>
                set("statHappyFamilies", Number(e.target.value))
              }
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

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-emerald-500">Saved.</p>}

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
