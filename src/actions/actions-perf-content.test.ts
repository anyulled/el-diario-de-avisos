import { describe, it, expect, vi, afterEach } from "vitest";
import { getArticlesOnThisDay } from "./actions";
import { db } from "@/db";
import { articles } from "@/db/schema";

vi.mock("@/db", () => {
  const mockChain = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((resolve: (val: unknown[]) => void) => resolve([])),
  };
  return {
    db: {
      select: vi.fn().mockReturnValue(mockChain),
    },
  };
});

vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
}));

vi.mock("@/lib/rtf-content-converter", () => ({
  processRtfContent: vi.fn(),
  stripHtml: vi.fn(),
}));

describe("getArticlesOnThisDay Content Optimization", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should conditionally fetch content to avoid over-fetching", async () => {
    await getArticlesOnThisDay(1, 1);

    const selectCall = (db.select as any).mock.calls[0][0];

    // Check that content is defined in the selection
    expect(selectCall.content).toBeDefined();

    // With optimization, it should NOT be the raw column object.
    // Without optimization, it IS the raw column object (from getTableColumns spread).
    expect(selectCall.content).not.toBe(articles.content);

    // Verify plainText is already optimized (substring)
    // So it should NOT be the raw column object
    expect(selectCall.plainText).not.toBe(articles.plainText);
  });
});
