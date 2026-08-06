import type { Metadata } from "next";
import { Geist_Mono, Instrument_Serif, Jost } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/MotionProvider";
import { getSiteUrl, SITE_NAME } from "@/lib/site-url";
import { NavigationProgressBar } from "@/components/layout/NavigationProgressBar";

// Body / UI. A geometric humanist sans — the wide, round bowls read as a
// furniture catalogue where a grotesk like Geist read as a SaaS dashboard.
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  display: "swap",
});

// Display. High-contrast editorial serif at a single weight — Instrument Serif
// has no bold, which is the point: size and spacing carry the hierarchy instead
// of weight, the way print does.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

// Kept: order ids, SKUs and audit rows need tabular digits.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${jost.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NavigationProgressBar />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
