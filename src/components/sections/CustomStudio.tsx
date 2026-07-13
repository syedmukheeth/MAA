"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { UploadCloud, Check } from "lucide-react";
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

const WOODS = ["Teak", "Sheesham", "Oak", "Walnut", "Mango Wood"];
const FINISHES = ["Matte", "Satin", "High Gloss", "Natural Oil"];
const BUDGETS = ["Under ₹50,000", "₹50,000 – ₹1,50,000", "₹1,50,000 – ₹5,00,000", "₹5,00,000+"];

export function CustomStudio() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [inspirationUrl, setInspirationUrl] = useState("");
  const [dimensions, setDimensions] = useState("");
  const [wood, setWood] = useState("");
  const [finish, setFinish] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [description, setDescription] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/custom-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          inspirationUrl,
          dimensions,
          wood,
          finish,
          budgetRange,
          description,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong, please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Something went wrong, please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="custom-studio" className="bg-charcoal px-6 py-28 lg:px-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-bronze">
            Custom Furniture Studio
          </p>
          <h2 className="mt-5 font-heading text-3xl text-ivory sm:text-4xl">
            Design Your Dream Furniture
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-ivory/70">
            Send us a photo, a Pinterest board, or just a description.
            Our design team turns it into furniture built exactly for your
            space.
          </p>

          <div className="relative mt-10 aspect-[4/3] overflow-hidden rounded-2xl">
            <Image
              src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1600&auto=format&fit=crop"
              alt="Custom furniture design consultation"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="rounded-2xl bg-ivory p-8 lg:p-10"
        >
          {submitted ? (
            <div className="flex h-full min-h-80 flex-col items-center justify-center text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-bronze/15 text-bronze">
                <Check size={26} />
              </span>
              <h3 className="mt-6 font-heading text-2xl text-charcoal">
                Request received
              </h3>
              <p className="mt-2 max-w-sm text-sm text-graphite/70">
                Our design team will reach out within 24 hours to discuss
                your custom piece.
              </p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={onSubmit}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone / WhatsApp</Label>
                  <Input
                    id="phone"
                    placeholder="+91"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inspiration">Pinterest link or inspiration URL</Label>
                <Input
                  id="inspiration"
                  placeholder="https://pinterest.com/..."
                  value={inspirationUrl}
                  onChange={(e) => setInspirationUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Upload inspiration image</Label>
                <label
                  htmlFor="file"
                  className="flex cursor-pointer items-center justify-center gap-3 rounded-lg border border-dashed border-graphite/30 px-4 py-6 text-sm text-graphite/70 transition-colors hover:border-bronze hover:text-bronze"
                >
                  <UploadCloud size={20} />
                  {fileName ?? "Click to upload a photo"}
                  <input
                    id="file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Width x Depth x Height</Label>
                  <Input
                    placeholder='e.g. 72" x 36" x 30"'
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Wood</Label>
                  <Select value={wood} onValueChange={(v) => setWood(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose wood" />
                    </SelectTrigger>
                    <SelectContent>
                      {WOODS.map((w) => (
                        <SelectItem key={w} value={w}>
                          {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Finish</Label>
                  <Select value={finish} onValueChange={(v) => setFinish(v ?? "")}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose finish" />
                    </SelectTrigger>
                    <SelectContent>
                      {FINISHES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Budget range</Label>
                <Select value={budgetRange} onValueChange={(v) => setBudgetRange(v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGETS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">Describe what you need</Label>
                <Textarea
                  id="desc"
                  placeholder="Tell us about the piece you're imagining..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-brand-red">{error}</p>}

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full rounded-full bg-bronze text-ivory hover:bg-bronze/90"
              >
                {submitting ? "Submitting..." : "Submit Design Request"}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
}
