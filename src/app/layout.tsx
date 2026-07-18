import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/MotionProvider";
import { getSiteUrl, SITE_NAME } from "@/lib/site-url";
import { NavigationProgressBar } from "@/components/layout/NavigationProgressBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

export const metadata: Metadata = {
  // Without metadataBase, relative OG image paths resolve to localhost in
  // production and every link preview breaks.
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "MAA FURNITURE | Crafted For Homes, Built For Generations",
    // Product/combo pages supply their own name; this frames it.
    template: "%s | MAA FURNITURE",
  },
  description:
    "Premium handcrafted furniture designed to bring timeless beauty and lasting comfort into every space. Handcrafted in Kurnool, delivered across India.",
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: SITE_NAME,
    title: "MAA FURNITURE | Crafted For Homes, Built For Generations",
    description:
      "Premium handcrafted furniture, built to outlast trends. Handcrafted in Kurnool, delivered across India.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NavigationProgressBar />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
