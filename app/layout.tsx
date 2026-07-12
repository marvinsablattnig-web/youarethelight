import type { Metadata } from "next";

import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { CookieConsentProvider } from "@/lib/cookie-consent";
import "./globals.css";

export const metadata: Metadata = {
  title: "youarethelight",
  description:
    "Portfolio-Landingpage für Filmproduktion, Imagefilm, Eventfilm, Produktfilm und Social Media.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="bg-[var(--bg)] text-[var(--ink)] antialiased">
        <CookieConsentProvider>
          {children}
          <CookieConsentBanner />
        </CookieConsentProvider>
      </body>
    </html>
  );
}
