import { describe, it, expect, vi, beforeEach } from "vitest";
import { getArticleCount, formatArticleCount } from "./articles";
import { db } from "@/db";

// Mock next/cache
vi.mock("next/cache", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
  unstable_cache: (fn: any) => fn,
}));

// Mock db
vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn(),
  },
}));

describe("getArticleCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return the article count when DB query succeeds", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    (db.select as any).mockReturnValue({
      from: vi.fn().mockResolvedValue([{ value: 12345 }]),
    });

    const count = await getArticleCount();
    expect(count).toBe(12345);
  });

  it("should return 0 when DB query fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // Noop
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    (db.select as any).mockReturnValue({
      from: vi.fn().mockRejectedValue(new Error("DB Error")),
    });

    const count = await getArticleCount();
    expect(count).toBe(0);
    expect(consoleSpy).toHaveBeenCalledWith("Error fetching article count:", expect.any(Error));
  });
});

describe("formatArticleCount", () => {
  it("should format a valid count correctly", () => {
    expect(formatArticleCount(22953)).toBe("22,900+");
    expect(formatArticleCount(12345)).toBe("12,300+");
    expect(formatArticleCount(100)).toBe("100+");
  });

  it("should return the fallback for 0", () => {
    expect(formatArticleCount(0)).toBe("22,900+");
  });

  it("should return the fallback for negative numbers", () => {
    expect(formatArticleCount(-1)).toBe("22,900+");
  });
});
