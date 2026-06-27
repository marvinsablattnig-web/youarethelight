import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Malte Media | you are the light",
  description:
    "Portfolio-Landingpage fuer Filmproduktion, Imagefilm, Eventfilm, Produktfilm und Social Media.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="bg-[var(--bg)] text-[var(--ink)] antialiased">{children}</body>
    </html>
  );
}
