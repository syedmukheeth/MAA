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

  const nextSlide = () => setActive((prev) => (prev + 1) % STEPS.length);
  const prevSlide = () => setActive((prev) => (prev - 1 + STEPS.length) % STEPS.length);

  return (
    <section
      id="craftsmanship"
      ref={sectionRef}
      className="relative bg-charcoal"
      style={isMobile ? { height: "75vh", minHeight: "500px" } : { height: `${STEPS.length * 100}vh` }}
    >
      <div className={isMobile ? "relative h-full w-full overflow-hidden flex flex-col justify-end" : "sticky top-0 h-screen overflow-hidden"}>
        {/* Background Images */}
        {isMobile ? (
          <div className="absolute inset-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={(e, info) => {
                  if (info.offset.x < -50) {
                    nextSlide();
                  } else if (info.offset.x > 50) {
                    prevSlide();
                  }
                }}
              >
                <Image
                  src={STEPS[active].image}
                  alt={STEPS[active].title}
                  fill
                  className="object-cover select-none pointer-events-none"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/95 via-charcoal/50 to-charcoal/60" />
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          STEPS.map((step, i) => (
            <div
              key={step.title}
              className="absolute inset-0 transition-opacity duration-700"
              style={{ opacity: active === i ? 1 : 0 }}
            >
              <Image
                src={step.image}
                alt={step.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/40 to-charcoal/60" />
            </div>
          ))
        )}

        {/* Content Area */}
        <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col justify-end px-6 pb-16 lg:px-10">
          <p className="text-xs uppercase tracking-[0.35em] text-bronze">
            The Art of Craftsmanship
          </p>
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-baseline gap-4">
              <span className="font-heading text-2xl text-bronze">
                0{active + 1}
              </span>
              <h3 className="font-heading text-4xl text-ivory sm:text-5xl">
                {STEPS[active].title}
              </h3>
            </div>
            
            {/* Mobile Navigation Chevrons */}
            {isMobile && (
              <div className="flex gap-3">
                <button
                  onClick={prevSlide}
                  aria-label="Previous step"
                  className="rounded-full border border-ivory/20 p-2 text-ivory hover:border-bronze hover:text-bronze bg-charcoal/40 backdrop-blur-xs transition-colors cursor-pointer"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={nextSlide}
                  aria-label="Next step"
                  className="rounded-full border border-ivory/20 p-2 text-ivory hover:border-bronze hover:text-bronze bg-charcoal/40 backdrop-blur-xs transition-colors cursor-pointer"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
          
          <p className="mt-4 max-w-lg text-ivory/75 min-h-[60px]">{STEPS[active].desc}</p>

          {/* Clickable progress bars */}
          <div className="mt-10 flex gap-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                aria-label={`Go to step ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  i === active 
                    ? "bg-bronze flex-[2]" 
                    : i < active 
                      ? "bg-bronze/60 flex-1" 
                      : "bg-ivory/20 flex-1"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
