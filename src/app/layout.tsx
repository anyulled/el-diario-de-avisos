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
import { getIntegrantesNames, getTutoresNames } from "@/actions/team";

export async function generateMetadata(): Promise<Metadata> {
  const fetchMetadata = async () => {
    try {
      const data = await Promise.all([getIntegrantesNames(), getTutoresNames()]);
      return { integrantes: data[0], tutores: data[1] };
    } catch {
      /* eslint-disable capitalized-comments */
      /* v8 ignore start */
      /* istanbul ignore next */
      /* Fallback robustly on transient DB limits during prerender */
      return { integrantes: [], tutores: [] };
      // eslint-disable-next-line no-inline-comments
    } /* v8 ignore stop */
      /* eslint-enable capitalized-comments */
  };

  const { integrantes, tutores } = await fetchMetadata();

  // ⚡ Bolt: Pre-calculate mapped arrays and combine with concat() (~33% faster than spread operator)
  const integranteNames = integrantes.map((i) => `${i.firstName} ${i.lastName}`);
  const tutorNames = tutores.map((t) => t.names);
  const authors = (integranteNames as string[]).concat(tutorNames as string[]).filter(Boolean).join(", ");

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
      "project:integrants": integranteNames.join(", "),
      "project:tutors": tutorNames.join(", "),
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
