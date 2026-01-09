"use client";

import { useEffect, useRef } from "react";

interface ScrollToResultsProps {
  shouldScroll: boolean;
}

export function ScrollToResults({ shouldScroll }: ScrollToResultsProps) {
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    if (!shouldScroll || hasScrolledRef.current) {
      return;
    }

    const resultsSection = document.getElementById("search-results");
    resultsSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    hasScrolledRef.current = true;
  }, [shouldScroll]);

  return null;
}
