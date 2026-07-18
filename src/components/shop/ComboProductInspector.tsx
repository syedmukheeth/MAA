"use client";

import { useEffect, useState } from "react";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { SafeImage } from "./SafeImage";
import { motion, AnimatePresence } from "framer-motion";

export type InspectorProduct = {
  id: string;
  name: string;
  description: string;
  price: string;
  materials: string[];
  dimensions: string | null;
  images: string[];
};

export function ComboProductInspector({
  products,
  open,
  onClose,
  initialProductId,
}: {
  products: InspectorProduct[];
  open: boolean;
  onClose: () => void;
  initialProductId: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Sync active product index when modal opens with a specific product
  useEffect(() => {
    if (open && initialProductId) {
      const idx = products.findIndex((p) => p.id === initialProductId);
      if (idx !== -1) {
        setActiveIdx(idx);
        setActiveImageIdx(0);
      }
    }
  }, [open, initialProductId, products]);

  // Handle ESC key close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // lock scroll
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = ""; // restore scroll
    };
  }, [open, onClose]);

  if (!open || products.length === 0) return null;

  const product = products[activeIdx];
  const images = product?.images || [];
  const currentImage = images[activeImageIdx] || "/placeholder-furniture.svg";

  const handleNext = () => {
    setActiveIdx((prev) => (prev + 1) % products.length);
    setActiveImageIdx(0);
  };

  const handlePrev = () => {
    setActiveIdx((prev) => (prev - 1 + products.length) % products.length);
    setActiveImageIdx(0);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-10">
        {/* Glassmorphic Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-charcoal/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative z-10 flex h-full max-h-[85vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-linen/20 bg-white shadow-2xl"
        >
          {/* Top Bar / Navigation Tabs */}
          <div className="flex flex-col border-b border-border bg-cream/30 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
              <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-graphite/40">
                Combo Items:
              </span>
              {products.map((p, idx) => {
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveIdx(idx);
                      setActiveImageIdx(0);
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      isActive
                        ? "bg-bronze text-ivory font-semibold shadow-xs"
                        : "bg-cream text-charcoal hover:bg-linen/50"
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-graphite/60 hover:bg-cream hover:text-charcoal transition-colors sm:static"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
              
              {/* Left Column: Image Section (12 cols, 5 cols on lg) */}
              <div className="space-y-4 lg:col-span-6">
                <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-cream border border-linen/40">
                  <SafeImage
                    src={currentImage}
                    alt={product.name}
                    fill
                    sizes="(min-width: 1024px) 450px, 100vw"
                    className="object-cover"
                  />

                  {/* Quick Carousel Controls */}
                  {images.length > 1 && (
                    <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIdx(idx)}
                          className={`size-2 rounded-full transition-all ${
                            idx === activeImageIdx ? "bg-bronze w-4" : "bg-charcoal/30 hover:bg-charcoal/50"
                          }`}
                          aria-label={`Go to slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Thumbnail Picker */}
                {images.length > 1 && (
                  <div className="flex gap-2.5 overflow-x-auto pb-1">
                    {images.map((img, idx) => {
                      const isSelected = idx === activeImageIdx;
                      return (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIdx(idx)}
                          className={`relative size-16 shrink-0 overflow-hidden rounded-lg bg-cream border-2 transition-all ${
                            isSelected ? "border-bronze" : "border-transparent hover:border-linen"
                          }`}
                        >
                          <SafeImage
                            src={img}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Information (7 cols on lg) */}
              <div className="flex flex-col justify-between lg:col-span-6">
                <div className="space-y-5">
                  <div>
                    <h3 className="font-heading text-2xl text-charcoal sm:text-3xl">
                      {product.name}
                    </h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-bronze">
                      Included Item
                    </p>
                  </div>

                  <p className="text-sm leading-relaxed text-graphite/80 whitespace-pre-line">
                    {product.description}
                  </p>

                  <div className="border-t border-border pt-4 space-y-3 text-sm">
                    {product.materials.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-charcoal">Materials:</span>
                        <span className="text-graphite/70">
                          {product.materials.join(", ")}
                        </span>
                      </div>
                    )}
                    {product.dimensions && (
                      <div>
                        <span className="font-medium text-charcoal">Dimensions:</span>{" "}
                        <span className="text-graphite/70">{product.dimensions}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Picker Customization Tip */}
                <div className="mt-8 rounded-2xl bg-cream/70 p-4 border border-linen/40 flex items-start gap-3">
                  <div className="rounded-full bg-bronze/10 p-1 text-bronze shrink-0">
                    <Check size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-charcoal">
                      Part of the Combo Bundle
                    </p>
                    <p className="mt-0.5 text-xs text-graphite/60">
                      Configure options for this item using the selects on the main page to build your perfect custom combo.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Quick Item Pager Footer */}
          <div className="flex items-center justify-between border-t border-border bg-cream/20 p-4 px-6">
            <button
              onClick={handlePrev}
              className="flex items-center gap-1 text-xs font-medium text-graphite hover:text-charcoal transition-colors"
            >
              <ChevronLeft size={16} /> Previous Item
            </button>
            <span className="text-xs text-graphite/50 font-medium">
              Item {activeIdx + 1} of {products.length}
            </span>
            <button
              onClick={handleNext}
              className="flex items-center gap-1 text-xs font-medium text-graphite hover:text-charcoal transition-colors"
            >
              Next Item <ChevronRight size={16} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
