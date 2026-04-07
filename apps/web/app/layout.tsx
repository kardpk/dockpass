import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "DockPass — Your charter trip, all in one link",
  description:
    "Check in, sign your waiver, and get your boarding pass — all from one link. No app download required.",
  icons: { icon: "/favicon.ico" },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0C447C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
