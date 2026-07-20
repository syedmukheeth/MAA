import type { Metadata } from "next";
import { CustomStudio } from "@/components/sections/CustomStudio";
import { getSiteSettings } from "@/lib/site-settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Custom Furniture Studio | MAA FURNITURE",
  description:
    "Design your dream furniture. Send us a photo, a Pinterest board, or a description and our team builds it exactly for your space.",
};

export default async function CustomStudioPage() {
  const settings = await getSiteSettings();

  return (
    <div className="-mt-20">
      <div className="bg-charcoal pt-20">
        <div className="mx-auto max-w-7xl px-6 pt-16 text-center lg:px-10">
          <h1 className="font-heading text-4xl text-ivory sm:text-5xl">
            Custom Studio
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-ivory/70">
            Furniture built to your exact space, taste, and budget — from a
            single chair to a full home.
          </p>
        </div>
      </div>
      <CustomStudio
        studioWoods={settings.studioWoods}
        studioFinishes={settings.studioFinishes}
        studioBudgets={settings.studioBudgets}
        studioFeatures={settings.studioFeatures}
      />
    </div>
  );
}
