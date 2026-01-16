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
import { getIntegrantes, getTutores } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const [integrantes, tutores] = await Promise.all([getIntegrantes(), getTutores()]);

  const authors = [...integrantes.map((i) => `${i.firstName} ${i.lastName}`), ...tutores.map((t) => t.names)].filter(Boolean).join(", ");

  return {
    metadataBase: new URL("https://diariodeavisos-archivo.vercel.app"),
    title: {
      default: "Noticias Musicales en el Diario de Avisos",
      template: "%s | Noticias Musicales en el Diario de Avisos",
    },
    description: `Noticias Musicales en el Diario de Avisos. Explora la historia de Caracas a través de sus noticias musicales. Un proyecto realizado por: ${authors}.`,
    openGraph: {
      title: "Noticias Musicales en el Diario de Avisos",
      description: "Archivo histórico de noticias musicales de El Diario de Avisos",
      url: "https://diariodeavisos-archivo.vercel.app",
      siteName: "Noticias Musicales en el Diario de Avisos",
      locale: "es_ES",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Noticias Musicales en el Diario de Avisos",
      description: "Archivo histórico de noticias musicales de El Diario de Avisos",
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
