"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShowroomTeaser({
  address,
  hours,
}: {
  address: string;
  hours: string;
}) {
  return (
    <section className="bg-ivory px-6 py-24 lg:px-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="mx-auto grid max-w-7xl grid-cols-1 gap-10 rounded-2xl bg-cream p-8 lg:grid-cols-2 lg:p-14"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-bronze">
            Visit Our Showroom
          </p>
          <h2 className="mt-5 font-heading text-3xl text-charcoal sm:text-4xl">
            Walk through it before you own it.
          </h2>
          <div className="mt-8 space-y-5">
            <a
              href="https://maps.app.goo.gl/S6U6o7R79U3My4m46"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 hover:text-bronze transition-colors"
            >
              <MapPin className="mt-0.5 text-bronze shrink-0" size={20} />
              <p className="text-sm text-graphite/80 hover:text-bronze transition-colors">{address}</p>
            </a>
            <div className="flex items-start gap-3">
              <Clock className="mt-0.5 text-bronze" size={20} />
              <p className="text-sm text-graphite/80">{hours}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center lg:justify-end">
          <Button
            render={<Link href="/showroom" />}
            size="lg"
            className="rounded-full bg-charcoal px-8 text-ivory hover:bg-charcoal/90"
          >
            Plan Your Visit
            <ArrowRight className="ml-2" size={16} />
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
