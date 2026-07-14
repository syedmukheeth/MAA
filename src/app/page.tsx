import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { BrandStatement } from "@/components/sections/BrandStatement";
import { Collections } from "@/components/sections/Collections";
import { Craftsmanship } from "@/components/sections/Craftsmanship";
import { Materials } from "@/components/sections/Materials";
import { CustomStudio } from "@/components/sections/CustomStudio";
import { BestSellers } from "@/components/sections/BestSellers";
import { RoomInspirations } from "@/components/sections/RoomInspirations";
import { Testimonials } from "@/components/sections/Testimonials";
import { TrustBuilders } from "@/components/sections/TrustBuilders";
import { ShowroomFaqContact } from "@/components/sections/ShowroomFaqContact";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const settings = await getSiteSettings();

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero
          headline={settings.heroHeadline}
          subtext={settings.heroSubtext}
          imageUrl={settings.heroImageUrl}
          deliveryMessage={settings.deliveryMessage}
        />
        <BrandStatement label={settings.brandLabel} headline={settings.brandHeadline} />
        <Collections />
        <Craftsmanship />
        <Materials />
        <CustomStudio />
        <BestSellers />
        <RoomInspirations />
        <Testimonials />
        <TrustBuilders
          yearsExperience={settings.statYearsExperience}
          projectsDelivered={settings.statProjectsDelivered}
          happyFamilies={settings.statHappyFamilies}
          googleRating={settings.statGoogleRating}
        />
        <ShowroomFaqContact
          address={settings.showroomAddress}
          hours={settings.showroomHours}
          phone={settings.showroomPhone}
          whatsapp={settings.showroomWhatsapp}
        />
      </main>
      <Footer
        instagramUrl={settings.instagramUrl}
        facebookUrl={settings.facebookUrl}
        whatsapp={settings.showroomWhatsapp}
        deliveryMessage={settings.deliveryMessage}
      />
    </>
  );
}
