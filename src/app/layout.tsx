import type { Metadata } from "next";
// Import new fonts
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

import { ChatWidget } from "@/components/chat-widget";
import { Footer } from "@/components/footer";
import { MusicPlayer } from "@/components/music-player";
import { Analytics } from "@vercel/analytics/react";
import { getIntegrantesNames, getTutoresNames } from "@/actions/actions";

export async function generateMetadata(): Promise<Metadata> {
  const [integrantes, tutores] = await Promise.all([getIntegrantesNames(), getTutoresNames()]);

  const authors = [...integrantes.map((i) => `${i.firstName} ${i.lastName}`), ...tutores.map((t) => t.names)].filter(Boolean).join(", ");

  return {
    metadataBase: new URL("https://diariodeavisos-archivo.vercel.app"),
    title: {
      default: "Crónicas Musicales en la prensa caraqueña del siglo XIX",
      template: "%s | Crónicas Musicales en la prensa caraqueña del siglo XIX",
    },
    description: `Crónicas Musicales en la prensa caraqueña del siglo XIX. Explora la historia de Caracas a través de sus crónicas musicales. Un proyecto realizado por: ${authors}.`,
    openGraph: {
      title: "Crónicas Musicales en la prensa caraqueña del siglo XIX",
      description: "Archivo histórico de crónicas musicales de la prensa caraqueña",
      url: "https://diariodeavisos-archivo.vercel.app",
      siteName: "Crónicas Musicales en la prensa caraqueña del siglo XIX",
      locale: "es_ES",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Crónicas Musicales en la prensa caraqueña del siglo XIX",
      description: "Archivo histórico de crónicas musicales de la prensa caraqueña",
    },
    robots: {
      index: true,
      follow: true,
    },
    other: {
      "project:integrants": integrantes.map((i) => `${i.firstName} ${i.lastName}`).join(", "),
      "project:tutors": tutores.map((t) => t.names).join(", "),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}>
        {children}
        <Footer />
        <Analytics />
        <MusicPlayer />
        <ChatWidget />
      </body>
    </html>
  );
}
