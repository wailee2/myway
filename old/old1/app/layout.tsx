import type { Metadata, Viewport } from "next";
import { bricolage, jakarta } from "./fonts";
import { themeInitScript } from "@/lib/hooks/use-theme";
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
      </head>
      <body>
        <a
          href="#main"
          className="sr-only z-[100] rounded-md bg-secondary px-4 py-2 font-bold text-secondary-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
