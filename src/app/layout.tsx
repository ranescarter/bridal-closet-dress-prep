import type { Metadata } from "next";
import { Quattrocento_Sans, Trirong } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const display = Trirong({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const body = Quattrocento_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Bridal Closet · Dress Prep",
  description: "Swipe Gowns In Store favorites before your appointment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} antialiased`}>
        {/* Single header for Create link, Bride, and F&F — edit SiteHeader only */}
        <SiteHeader />
        <main className="mx-auto w-full max-w-[96rem] px-3 py-6 sm:px-5 sm:py-8 lg:px-6">
          {children}
        </main>
      </body>
    </html>
  );
}
