"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4 text-center">
      <h2 className="text-2xl font-bold mb-4 font-serif">Algo salió mal</h2>
      <p className="mb-4 text-muted-foreground">Ocurrió un error al cargar esta página.</p>
      <button onClick={() => reset()} className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors">
        Intentar de nuevo
      </button>
    </div>
  );
}
