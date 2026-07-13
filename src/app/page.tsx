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

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <BrandStatement />
        <Collections />
        <Craftsmanship />
        <Materials />
        <CustomStudio />
        <BestSellers />
        <RoomInspirations />
        <Testimonials />
        <TrustBuilders />
        <ShowroomFaqContact />
      </main>
      <Footer />
    </>
  );
}
