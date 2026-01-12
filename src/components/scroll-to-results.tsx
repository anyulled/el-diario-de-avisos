"use client";

import { useEffect } from "react";

interface ScrollToResultsProps {
  shouldScroll: boolean;
  scrollKey: string;
}

export function ScrollToResults({ shouldScroll, scrollKey }: ScrollToResultsProps) {
  useEffect(() => {
    if (!shouldScroll) {
      return;
    }

    const resultsSection = document.getElementById("search-results");
    resultsSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [shouldScroll, scrollKey]);

  return null;
}
