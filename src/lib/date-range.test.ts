import { describe, expect, it } from "vitest";

import { normalizeDateRange } from "@/lib/date-range";

describe("normalizeDateRange", () => {
  it("accepts a single start date", () => {
    const result = normalizeDateRange({ start: "2024-02-10", end: null });

    expect(result).toEqual({
      start: "2024-02-10",
      end: null,
      isValidRange: true,
    });
  });

  it("accepts a single end date", () => {
    const result = normalizeDateRange({ start: null, end: "2024-02-28" });

    expect(result).toEqual({
      start: null,
      end: "2024-02-28",
      isValidRange: true,
    });
  });

  it("accepts a valid range", () => {
    const result = normalizeDateRange({ start: "2024-02-10", end: "2024-02-28" });

    expect(result).toEqual({
      start: "2024-02-10",
      end: "2024-02-28",
      isValidRange: true,
    });
  });

  it("rejects an invalid range", () => {
    const result = normalizeDateRange({ start: "2024-03-05", end: "2024-03-01" });

    expect(result).toEqual({
      start: "2024-03-05",
      end: "2024-03-01",
      isValidRange: false,
    });
  });

  it("nulls malformed dates", () => {
    const result = normalizeDateRange({ start: "invalid", end: "2024-02-28" });

    expect(result).toEqual({
      start: null,
      end: "2024-02-28",
      isValidRange: true,
    });
  });
});
