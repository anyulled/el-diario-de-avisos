"use client";

import { useEffect } from "react";

export default function SentryTestPage() {
  useEffect(() => {
    // This logs a message to Sentry

    console.log("Sentry Test Page Loaded");
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Sentry Test Page</h1>
      <button
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        onClick={() => {
          throw new Error("Sentry Test Error");
        }}
      >
        Throw Error
      </button>
    </div>
  );
}
