import type { Metadata, Viewport } from "next";
import { bricolage, jakarta } from "./fonts";
import { themeInitScript } from "@/lib/hooks/use-theme";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { SwRegister } from "@/components/layout/sw-register";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "MYWAY · Find someone already going your way", template: "%s · MYWAY" },
  description: "Book a seat in a shared car with a verified driver already heading your way in Abuja. One clear price, a stop you can find, four seats at most.",
  applicationName: "MYWAY",
  manifest: "/manifest.webmanifest",
  openGraph: { title: "MYWAY · Find someone already going your way", description: "Shared rides with verified drivers going your way in Abuja.", type: "website", locale: "en_NG" },
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
      </head>
      <body>
        <PhoneFrame>{children}</PhoneFrame>
        <SwRegister />
      </body>
    </html>
  );
}
