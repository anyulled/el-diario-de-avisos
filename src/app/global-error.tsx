"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import "./globals.css";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";

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

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} antialiased`}>
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
          <h2 className="text-2xl font-bold mb-4 font-serif">Algo salió mal</h2>
          <p className="mb-4 text-muted-foreground">Ocurrió un error inesperado. Nuestro equipo ha sido notificado.</p>
          <button onClick={() => reset()} className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
