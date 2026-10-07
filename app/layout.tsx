import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Jost } from "next/font/google";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});

const sans = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
    metadataBase: new URL(getSiteUrl()),
    title: {
    default: "Muhammadi Art Gallery",
    template: "%s | Muhammadi Art Gallery",
  },
  description:
    "A premium online art gallery. Discover and collect original artwork, prints, calligraphy and more.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}