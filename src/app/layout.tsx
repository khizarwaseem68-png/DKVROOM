import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DK Vroom — Malaysia's Premium Automotive Marketplace",
  description: "Drive. Rent. Buy. Own. All in One Platform. Malaysia's luxury automotive super app for renting, buying, repairing, insuring, auctioning, and financing cars from verified dealers.",
  keywords: ["DK Vroom", "Malaysia automotive", "car rental", "buy car", "continue loan", "sambung bayar", "car auction", "car insurance", "auto loan"],
  authors: [{ name: "DK Vroom" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "DK Vroom — Drive Extraordinary",
    description: "Malaysia's Premium Automotive Marketplace",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
