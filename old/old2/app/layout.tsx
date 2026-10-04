import type { Metadata, Viewport } from "next";
import { bricolage, jakarta } from "./fonts";
import { themeInitScript } from "@/lib/hooks/use-theme";
import { phoneScaleScript } from "@/lib/phone-scale-script";
import { PhoneFrame } from "@/components/layout/phone-frame";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "MYWAY · Board once. Arrive on time.", template: "%s · MYWAY" },
  description: "Book a seat in a shared car or on a scheduled bus in Abuja. Fixed price, four seats maximum, verified drivers, and no more shouting “along”.",
  applicationName: "MYWAY",
  openGraph: { title: "MYWAY · Board once. Arrive on time.", description: "Seat-booked shared rides and scheduled buses for Abuja.", type: "website", locale: "en_NG" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf7ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${jakarta.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: phoneScaleScript }} />
      </head>
      <body>
        <PhoneFrame>{children}</PhoneFrame>
      </body>
    </html>
  );
}
