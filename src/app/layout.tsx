import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora, Playfair_Display } from "next/font/google"; // Import new fonts
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


const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "El Diario de Avisos",
  description: "Archivo histórico del periódico El Diario de Avisos",
};

import { MusicPlayer } from "@/components/music-player";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${lora.variable} antialiased`}
      >
        {children}
        <MusicPlayer />
      </body>
    </html>
  );
}
