"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    title: "Raw Wood",
    desc: "Sourced sustainably, seasoned for years before it ever touches a blade.",
    image:
      "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Precision Cutting",
    desc: "Every plank measured, marked, and cut to exacting tolerances.",
    image:
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Assembly",
    desc: "Joinery over hardware wherever possible, built to outlast trends.",
    image:
      "https://images.unsplash.com/photo-1509365465985-25d11c17e812?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Hand Finishing",
    desc: "Sanded, oiled, and sealed by hand across multiple passes.",
    image:
      "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Quality Inspection",
    desc: "Every joint, every finish, checked against a master craftsman's eye.",
    image:
      "https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?q=80&w=1600&auto=format&fit=crop",
  },
  {
    title: "Delivery",
    desc: "White-glove delivery and placement, straight into your home.",
    image:
      "https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=1600&auto=format&fit=crop",
  },
];

export function Craftsmanship() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const section = sectionRef.current;
    if (!section) return;

    const triggers = STEPS.map((_, i) =>
      ScrollTrigger.create({
        trigger: section,
        start: `${(i / STEPS.length) * 100}% top`,
        end: `${((i + 1) / STEPS.length) * 100}% top`,
        onToggle: (self) => self.isActive && setActive(i),
      })
    );

    return () => triggers.forEach((t) => t.kill());
  }, [isMobile]);

  const handleMobileScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const width = container.getBoundingClientRect().width;
    // Account for slight offsets
    const newActive = Math.min(
      STEPS.length - 1,
      Math.max(0, Math.round(scrollLeft / (width - 16)))
    );
    if (newActive !== active) {
      setActive(newActive);
    }
  };

  const scrollToStep = (index: number) => {
    setActive(index);
    const container = scrollContainerRef.current;
    if (isMobile && container) {
      const width = container.getBoundingClientRect().width;
      container.scrollTo({
        left: index * (width - 16),
        behavior: "smooth",
      });
    }
  };

  const nextSlide = () => {
    const nextIdx = (active + 1) % STEPS.length;
    scrollToStep(nextIdx);
  };

  const prevSlide = () => {
    const prevIdx = (active - 1 + STEPS.length) % STEPS.length;
    scrollToStep(prevIdx);
  };

  return (
    <section
      id="craftsmanship"
      ref={sectionRef}
      className="relative bg-charcoal"
      style={isMobile ? { minHeight: "650px" } : { height: `${STEPS.length * 100}vh` }}
    >
      {isMobile ? (
        // Mobile Layout: Horizontal Scroll Snap Container
        <div className="flex flex-col justify-between py-20 px-6 h-full min-h-[650px]">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.35em] text-[#E6C280]">
              The Art of Craftsmanship
            </p>
            <h2 className="mt-4 font-heading text-3xl text-ivory">
              Our 6-Step Story
            </h2>
          </div>

          {/* Swipe Container */}
          <div
            ref={scrollContainerRef}
            onScroll={handleMobileScroll}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-2"
          >
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="w-[calc(100vw-48px)] flex-none snap-center rounded-2xl overflow-hidden bg-graphite/40 border border-ivory/10 flex flex-col justify-end aspect-[4/5] relative"
              >
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  className="object-cover pointer-events-none"
                  priority={i === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/95 via-charcoal/45 to-transparent" />
                
                <div className="relative z-10 p-6">
                  <div className="flex items-baseline gap-3">
                    <span className="font-heading text-lg text-[#E6C280]">
                      0{i + 1}
                    </span>
                    <h3 className="font-heading text-2xl text-ivory">
                      {step.title}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ivory/80">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Controls & Dots */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-1.5 flex-1 max-w-[200px]">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToStep(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    i === active
                      ? "bg-[#E6C280] w-6"
                      : "bg-ivory/20 w-2"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={prevSlide}
                aria-label="Previous step"
                className="rounded-full border border-ivory/20 p-2.5 text-ivory bg-charcoal/60 backdrop-blur-xs hover:border-[#E6C280] hover:text-[#E6C280] transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextSlide}
                aria-label="Next step"
                className="rounded-full border border-ivory/20 p-2.5 text-ivory bg-charcoal/60 backdrop-blur-xs hover:border-[#E6C280] hover:text-[#E6C280] transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Desktop Layout: Scroll-linked pinned views
        <div className="sticky top-0 h-screen overflow-hidden">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="absolute inset-0 transition-opacity duration-750 ease-in-out"
              style={{ opacity: active === i ? 1 : 0, pointerEvents: active === i ? "auto" : "none" }}
            >
              <Image
                src={step.image}
                alt={step.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-charcoal/60" />
            </div>
          ))}

          {/* Content Area */}
          <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col justify-end px-6 pb-16 lg:px-10">
            <p className="text-xs uppercase tracking-[0.35em] text-[#E6C280]">
              The Art of Craftsmanship
            </p>
            <div className="mt-6 flex items-center justify-between">
              <div className="flex items-baseline gap-4">
                <span className="font-heading text-2xl text-[#E6C280]">
                  0{active + 1}
                </span>
                <h3 className="font-heading text-4xl text-ivory sm:text-5xl">
                  {STEPS[active].title}
                </h3>
              </div>
            </div>
            
            <p className="mt-4 max-w-lg text-ivory/75 min-h-[60px]">{STEPS[active].desc}</p>

            {/* Clickable progress bars */}
            <div className="mt-10 flex gap-2">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => scrollToStep(i)}
                  aria-label={`Go to step ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    i === active 
                      ? "bg-[#E6C280] flex-[2]" 
                      : i < active 
                        ? "bg-[#E6C280]/60 flex-1" 
                        : "bg-ivory/20 flex-1"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
