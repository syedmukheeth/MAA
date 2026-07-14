"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "How long does custom furniture take to build?",
    a: "Most custom pieces take 3–6 weeks depending on complexity, wood availability, and finish. We'll confirm a timeline before you approve the order.",
  },
  {
    q: "Do you deliver outside your city?",
    a: "Yes, we ship pan-India with white-glove delivery and in-home placement for larger pieces like beds, sofas, and dining sets.",
  },
  {
    q: "What warranty do you offer?",
    a: "Every piece carries a 5-year structural warranty covering joinery and frame integrity, plus a 1-year finish warranty.",
  },
  {
    q: "Can I visit the showroom before ordering?",
    a: "Yes. Book an appointment below and our design team will walk you through materials, finishes, and live pieces in person.",
  },
];

export function ShowroomFaqContact({
  address,
  hours,
  phone,
  whatsapp,
}: {
  address: string;
  hours: string;
  phone: string;
  whatsapp: string;
}) {
  const [sent, setSent] = useState(false);
  const whatsappDigits = whatsapp.replace(/[^0-9]/g, "");

  return (
    <section id="showroom" className="bg-ivory px-6 py-28 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Showroom */}
        <div className="grid grid-cols-1 gap-12 rounded-2xl bg-cream p-8 lg:grid-cols-2 lg:p-14">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-bronze">
              Visit Our Showroom
            </p>
            <h2 className="mt-5 font-heading text-3xl text-charcoal sm:text-4xl">
              Walk through it before you own it.
            </h2>

            <div className="mt-8 space-y-5">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 text-bronze" size={20} />
                <p className="text-sm text-graphite/80">{address}</p>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 text-bronze" size={20} />
                <p className="text-sm text-graphite/80">{hours}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button
                render={<a href={phone ? `tel:${phone}` : "#contact"} />}
                className="rounded-full bg-charcoal text-ivory hover:bg-charcoal/90"
              >
                Book Appointment
              </Button>
              <Button
                render={
                  <a
                    href={
                      whatsappDigits
                        ? `https://wa.me/${whatsappDigits}`
                        : "#contact"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
                variant="outline"
                className="rounded-full border-graphite/30"
              >
                <MessageCircle className="mr-2" size={16} />
                WhatsApp Us
              </Button>
            </div>
          </div>

          <div className="relative min-h-64 overflow-hidden rounded-xl">
            <iframe
              title="MAA Furnitures Showroom Location"
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
            />
          </div>
        </div>

        {/* FAQ + Contact */}
        <div className="mt-24 grid grid-cols-1 gap-16 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-bronze">
              FAQs
            </p>
            <h2 className="mt-5 font-heading text-3xl text-charcoal sm:text-4xl">
              Questions, answered.
            </h2>
            <Accordion className="mt-8">
              {FAQS.map((f) => (
                <AccordionItem key={f.q} value={f.q}>
                  <AccordionTrigger className="font-heading text-base text-charcoal">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-graphite/70">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div id="contact">
            <p className="text-xs uppercase tracking-[0.35em] text-bronze">
              Contact
            </p>
            <h2 className="mt-5 font-heading text-3xl text-charcoal sm:text-4xl">
              Let&apos;s start the conversation.
            </h2>

            {sent ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 rounded-xl bg-cream p-8 text-center"
              >
                <p className="font-heading text-lg text-charcoal">
                  Message sent
                </p>
                <p className="mt-2 text-sm text-graphite/70">
                  We&apos;ll get back to you within one business day.
                </p>
              </motion.div>
            ) : (
              <form
                className="mt-8 space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contact-name">Name</Label>
                    <Input id="contact-name" placeholder="Your name" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input id="contact-email" type="email" placeholder="you@email.com" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-message">Message</Label>
                  <Textarea id="contact-message" placeholder="How can we help?" rows={4} />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full bg-bronze text-ivory hover:bg-bronze/90 sm:w-auto"
                >
                  <Send className="mr-2" size={16} />
                  Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
