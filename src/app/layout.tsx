import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

// Variable font: covers weights 400 to 800 in one file.
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const title = "Oravie Dental Studio · Dental care in Jumeirah";
const description =
  "Check-ups, whitening, fillings, root canals and aligners in Jumeirah, Dubai, with clear written prices. Ask Noor, our AI receptionist, and book at any hour.";

// Vercel sets this on deploy, so share images resolve to absolute URLs.
const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "Oravie Dental Studio",
  openGraph: { title, description, siteName: "Oravie Dental Studio", type: "website", locale: "en_AE" },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#0B2545",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}
