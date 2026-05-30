import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import AppShellWrapper from "@/components/app-shell";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DK Vroom — Malaysia's Premium Automotive Marketplace",
    template: "%s | DK Vroom",
  },
  description:
    "Drive. Rent. Buy. Own. All in One Platform. Malaysia's luxury automotive super app for renting, buying, repairing, insuring, auctioning, and financing cars from verified dealers.",
  keywords: [
    "DK Vroom",
    "Malaysia automotive",
    "car rental",
    "buy car",
    "continue loan",
    "sambung bayar",
    "car auction",
    "car insurance",
    "auto loan",
    "salvage cars",
    "rebuild project",
  ],
  authors: [{ name: "DK Vroom" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "DK Vroom — Drive Extraordinary",
    description: "Malaysia's Premium Automotive Marketplace",
    type: "website",
    siteName: "DK Vroom",
    locale: "en_MY",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${geistMono.variable} ${playfair.variable} font-sans antialiased bg-background text-foreground`}
      >
        <AppShellWrapper>{children}</AppShellWrapper>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            className: "border-border",
          }}
        />
      </body>
    </html>
  );
}
