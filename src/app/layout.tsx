import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GlobalCompareBar } from "@/components/global-compare-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SideBySide — AI Product Discovery, Lab Ratings & Side-by-Side Comparison",
    template: "%s — SideBySide",
  },
  description:
    "Discover products through multi-criteria AI reasoning, inspect independent lab scorecards, compare structured specifications side-by-side, and track verified price history.",
  applicationName: "SideBySide",
  keywords: [
    "product comparison",
    "AI shopping advisor",
    "lab benchmarks",
    "side by side specs",
    "price history tracker",
    "editorial buying guide",
  ],
  openGraph: {
    title: "SideBySide — Find what fits, compare with confidence",
    description:
      "Transparent multi-criteria AI product recommendations, lab telemetry, and structured side-by-side comparisons.",
    type: "website",
    siteName: "SideBySide",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f5f0",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <GlobalCompareBar />
      </body>
    </html>
  );
}
