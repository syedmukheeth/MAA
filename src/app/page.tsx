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
import { getCurrentUser } from "@/lib/auth/session";
import { getCartItemCount } from "@/lib/cart";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, user, testimonials, featuredProducts, counts] = await Promise.all([
    getSiteSettings(),
    getCurrentUser(),
    prisma.testimonial.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { featured: true },
      take: 4,
    }),
    prisma.product.groupBy({
      by: ["category"],
      _count: {
        id: true,
      },
    }),
  ]);

  const cartItemCount = user ? await getCartItemCount(user.sub) : 0;

  const categoryCounts = counts.reduce((acc, curr) => {
    acc[curr.category] = curr._count.id;
    return acc;
  }, {} as Record<string, number>);

  return (
    <>
      <Navbar user={user ? { role: user.role } : null} cartItemCount={cartItemCount} />
      <main className="flex-1">
        <Hero
          headline={settings.heroHeadline}
          subtext={settings.heroSubtext}
          imageUrl={settings.heroImageUrl}
          deliveryMessage={settings.deliveryMessage}
        />
        <BrandStatement label={settings.brandLabel} headline={settings.brandHeadline} />
        <Collections categoryCounts={categoryCounts} />
        <Craftsmanship />
        <Materials />
        <CustomStudio />
        <BestSellers products={featuredProducts.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category,
          price: p.price.toString(),
          images: p.images,
        }))} />
        <RoomInspirations />
        <Testimonials testimonials={testimonials} />
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
