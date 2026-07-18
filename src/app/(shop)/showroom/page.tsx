import type { Metadata } from "next";
import { RoomInspirations } from "@/components/sections/RoomInspirations";
import { ShowroomFaqContact } from "@/components/sections/ShowroomFaqContact";
import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Showroom | MAA FURNITURE",
  description:
    "Visit the MAA FURNITURE showroom — walk through live pieces, explore materials and finishes, and talk to our design team in person.",
};

export default async function ShowroomPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 pt-10 text-center lg:px-10">
        <h1 className="font-heading text-4xl text-charcoal sm:text-5xl">
          Our Showroom
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-graphite/70">
          Walk through it before you own it — see the wood, feel the finish,
          and picture it in your home.
        </p>
      </div>
      <ShowroomFaqContact
        address={settings.showroomAddress}
        hours={settings.showroomHours}
        phone={settings.showroomPhone}
        whatsapp={settings.showroomWhatsapp}
      />
      <RoomInspirations />
    </div>
  );
}
