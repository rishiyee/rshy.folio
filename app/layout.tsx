import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Hrishikesh Vyshnav — Designer & Developer",
    template: "%s — Hrishikesh Vyshnav",
  },
  description:
    "Portfolio of Hrishikesh Vyshnav, an independent designer and developer creating brands, products, interfaces, and expressive digital experiences.",
  keywords: ["Hrishikesh Vyshnav", "product designer", "UI UX designer", "creative developer", "frontend developer", "portfolio"],
  authors: [{ name: "Hrishikesh Vyshnav" }],
  creator: "Hrishikesh Vyshnav",
  openGraph: {
    type: "website",
    title: "Hrishikesh Vyshnav — Designer & Developer",
    description: "Selected work across identity, interface, product design, and creative development.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hrishikesh Vyshnav — Designer & Developer",
    description: "Selected work across identity, interface, product design, and creative development.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
