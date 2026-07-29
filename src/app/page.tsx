import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { BrandStatement } from "@/components/sections/BrandStatement";
import { CustomStudioTeaser } from "@/components/sections/CustomStudioTeaser";
import { BestSellers } from "@/components/sections/BestSellers";
import { Testimonials } from "@/components/sections/Testimonials";
import { TrustBuilders } from "@/components/sections/TrustBuilders";
import { ShowroomTeaser } from "@/components/sections/ShowroomTeaser";
import { getSiteSettings } from "@/lib/site-settings";
import { getCurrentUser } from "@/lib/auth/session";
import { getCartItemCount } from "@/lib/cart";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [settings, user, testimonials, featuredProducts] = await Promise.all([
    getSiteSettings(),
    getCurrentUser(),
    prisma.testimonial.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { featured: true, isActive: true },
      take: 4,
    }),
  ]);

  const cartItemCount = user ? await getCartItemCount(user.sub) : 0;

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
        <CustomStudioTeaser />
        <BestSellers products={featuredProducts.map(p => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          category: p.category,
          price: p.price.toString(),
          mrp: p.mrp?.toString() ?? null,
          images: p.images,
        }))} />
        <Testimonials testimonials={testimonials} />
        <TrustBuilders
          yearsExperience={settings.statYearsExperience}
          projectsDelivered={settings.statProjectsDelivered}
          happyFamilies={settings.statHappyFamilies}
          googleRating={settings.statGoogleRating}
        />
        <ShowroomTeaser
          address={settings.showroomAddress}
          hours={settings.showroomHours}
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
