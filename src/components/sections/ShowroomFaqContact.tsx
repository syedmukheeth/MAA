"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin, Clock, MessageCircle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    a: "Currently, we deliver only within Andhra Pradesh. If you reside in another state, we hope to serve you soon! Feel free to contact us at 8886995345 or 9912330151 for inquiries.",
  },
  {
    q: "What warranty do you offer?",
    a: "Every piece carries a 5-year structural warranty covering joinery and frame integrity, plus a 1-year finish warranty.",
  },
  {
    q: "Can I visit the showroom before ordering?",
    a: "Yes. You can visit our showroom during working hours to explore materials, finishes, and live pieces in person. No appointment is needed.",
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
  const [mapLoaded, setMapLoaded] = useState(false);
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
              <a
                href={`tel:${phone}`}
                className="flex items-start gap-3 hover:text-bronze transition-colors"
              >
                <Phone className="mt-0.5 text-bronze shrink-0" size={20} />
                <p className="text-sm text-graphite/80 hover:text-bronze transition-colors">{phone}</p>
              </a>
              <a
                href="mailto:maafurniture.shop@gmail.com"
                className="flex items-start gap-3 hover:text-bronze transition-colors"
              >
                <Mail className="mt-0.5 text-bronze shrink-0" size={20} />
                <p className="text-sm text-graphite/80 hover:text-bronze transition-colors">maafurniture.shop@gmail.com</p>
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
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
                className="rounded-full bg-charcoal text-ivory hover:bg-charcoal/90"
              >
                <MessageCircle className="mr-2" size={16} />
                WhatsApp Us
              </Button>
            </div>
          </div>

          {/*
            Click-to-load, not an eager iframe.

            Embedded directly, this contacts Google and sets Google's cookies
            the moment anyone opens /showroom, whether or not they ever look at
            the map — an undisclosed transfer of every visitor's IP address and
            referrer to a third party. Deferring it until someone asks for the
            map makes the transfer a choice, disclosed in the notice, and cuts
            a third-party frame out of the initial page load.

            No cookie banner: DPDP has no ePrivacy-style consent-for-cookies
            rule, so a banner would be the wrong regulation's answer — and one
            everybody clicks through without reading.
          */}
          <div className="relative min-h-64 overflow-hidden rounded-xl border border-linen">
            {mapLoaded ? (
              <iframe
                title="MAA FURNITURE Showroom Location"
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3815.6388!2d78.0206856!3d15.8375006!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bb5dd6d6cc56eef%3A0x731e09d8ec60ef2d!2sMAA%20FURNITURE!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-cream p-6 text-center">
                <MapPin className="text-bronze" size={28} />
                <p className="text-sm text-graphite/70">{address}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMapLoaded(true)}
                  className="rounded-full"
                >
                  Show map
                </Button>
                <p className="max-w-xs text-xs text-graphite/50">
                  Loads Google Maps, which will see your IP address. See our{" "}
                  <Link href="/privacy" className="underline hover:text-bronze">
                    Privacy Notice
                  </Link>
                  .{" "}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-bronze"
                  >
                    Or get directions
                  </a>
                  .
                </p>
              </div>
            )}
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

            {/*
              This was a form that called preventDefault(), set a flag, and
              rendered "Message sent — we'll get back to you within one business
              day." It had no action, no endpoint and no storage: every enquiry
              typed into it was discarded while the customer was told it had
              arrived.

              Replaced with the channels that actually reach someone rather than
              rebuilt, because building it properly would mean a new store of
              names, emails and message bodies — a fresh personal-data category
              with its own retention and deletion obligations — to duplicate a
              WhatsApp number that already works and is where this business
              actually converts.
            */}
            <p className="mt-6 text-sm leading-relaxed text-graphite/70">
              We answer fastest on WhatsApp, usually within a couple of hours
              during showroom hours. Call us if it is urgent.
            </p>

            <div className="mt-8 space-y-3">
              <a
                href={`https://wa.me/${whatsappDigits.startsWith("91") ? whatsappDigits : `91${whatsappDigits}`}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-linen bg-cream p-4 transition-colors hover:border-bronze/40"
              >
                <MessageCircle className="text-bronze" size={20} />
                <span className="text-sm">
                  <span className="block font-medium text-charcoal">
                    WhatsApp us
                  </span>
                  <span className="text-graphite/60">{whatsapp}</span>
                </span>
              </a>

              <a
                href={`tel:${phone.split(",")[0]?.replace(/[^0-9+]/g, "")}`}
                className="flex items-center gap-3 rounded-xl border border-linen bg-cream p-4 transition-colors hover:border-bronze/40"
              >
                <Phone className="text-bronze" size={20} />
                <span className="text-sm">
                  <span className="block font-medium text-charcoal">Call us</span>
                  <span className="text-graphite/60">{phone}</span>
                </span>
              </a>

              <a
                href="mailto:maafurniture.shop@gmail.com"
                className="flex items-center gap-3 rounded-xl border border-linen bg-cream p-4 transition-colors hover:border-bronze/40"
              >
                <Mail className="text-bronze" size={20} />
                <span className="text-sm">
                  <span className="block font-medium text-charcoal">Email us</span>
                  <span className="text-graphite/60">
                    maafurniture.shop@gmail.com
                  </span>
                </span>
              </a>
            </div>

            <p className="mt-6 text-xs text-graphite/50">
              For anything about your personal data — a correction, a deletion,
              or a complaint — use our{" "}
              <Link href="/grievance" className="underline hover:text-bronze">
                grievance page
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
