"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Scroll position here is *state*, not animation — GSAP ScrollTrigger was doing
 * nothing but reporting "which step is on screen" via onToggle. IntersectionObserver
 * is that job exactly, and it removes GSAP + ScrollTrigger (~34kB) plus a second
 * animation dialect competing with Framer inside one component.
 */

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

/** Respect the OS preference for JS-driven scrolling; CSS can't reach scrollTo(). */
function scrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined") return "auto";
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

export function Craftsmanship() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Desktop: one sentinel per step, spanning that step's slice of the tall
  // section. The -50% root margin collapses the viewport to its centre line, so
  // exactly one sentinel intersects at a time.
  useEffect(() => {
    if (isMobile) return;
    const nodes = sentinelsRef.current.filter(Boolean) as HTMLDivElement[];
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = Number((entry.target as HTMLElement).dataset.step);
          if (!Number.isNaN(i)) setActive(i);
        }
      },
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 }
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
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

  const scrollToStep = useCallback(
    (index: number) => {
      const container = scrollContainerRef.current;
      if (isMobile) {
        setActive(index);
        if (!container) return;
        const width = container.getBoundingClientRect().width;
        container.scrollTo({
          left: index * (width - 16),
          behavior: scrollBehavior(),
        });
        return;
      }

      // Desktop: the progress bar previously only called setActive(), which the
      // scroll sensor immediately overwrote — the clicks did nothing. Active
      // state is derived from scroll position here, so move the scroll instead.
      const section = sectionRef.current;
      if (!section) return;
      const top = section.offsetTop + (section.offsetHeight / STEPS.length) * index;
      window.scrollTo({ top, behavior: scrollBehavior() });
    },
    [isMobile]
  );

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
            <p className="text-xs uppercase tracking-[0.35em] text-gold">
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
                    <span className="font-heading text-lg text-gold">
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
                  aria-label={`Step ${i + 1}: ${STEPS[i].title}`}
                  aria-current={i === active ? "step" : undefined}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${
                    i === active
                      ? "bg-gold w-6"
                      : "bg-ivory/20 w-2"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={prevSlide}
                aria-label="Previous step"
                className="rounded-full border border-ivory/20 p-2.5 text-ivory bg-charcoal/60 backdrop-blur-xs hover:border-gold hover:text-gold transition-colors cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextSlide}
                aria-label="Next step"
                className="rounded-full border border-ivory/20 p-2.5 text-ivory bg-charcoal/60 backdrop-blur-xs hover:border-gold hover:text-gold transition-colors cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Scroll sentinels — invisible, one per step. These are what the
              IntersectionObserver watches; they carry no content. */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-full">
            {STEPS.map((_, i) => (
              <div
                key={i}
                data-step={i}
                ref={(el) => {
                  sentinelsRef.current[i] = el;
                }}
                className="absolute left-0 w-px"
                style={{ top: `${i * 100}vh`, height: "100vh" }}
              />
            ))}
          </div>

          {/* Desktop Layout: Scroll-linked pinned views */}
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
            <p className="text-xs uppercase tracking-[0.35em] text-gold">
              The Art of Craftsmanship
            </p>
            {/* The step changes as you scroll; without aria-live a screen reader
                is never told, and the section silently becomes decorative. */}
            <div aria-live="polite" aria-atomic="true">
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-baseline gap-4">
                  <span className="font-heading text-2xl text-gold">0{active + 1}</span>
                  <h3 className="font-heading text-4xl text-ivory sm:text-5xl">
                    {STEPS[active].title}
                  </h3>
                </div>
              </div>
              <p className="mt-4 max-w-lg text-ivory/75 min-h-[60px]">
                {STEPS[active].desc}
              </p>
            </div>

            {/* Clickable progress bars */}
            <div className="mt-10 flex gap-2">
              {STEPS.map((step, i) => (
                <button
                  key={i}
                  onClick={() => scrollToStep(i)}
                  aria-label={`Step ${i + 1}: ${step.title}`}
                  aria-current={i === active ? "step" : undefined}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${
                    i === active
                      ? "bg-gold flex-[2]"
                      : i < active
                        ? "bg-gold/60 flex-1"
                        : "bg-ivory/20 flex-1"
                  }`}
                />
              ))}
            </div>
          </div>
          </div>
        </>
      )}
    </section>
  );
}
