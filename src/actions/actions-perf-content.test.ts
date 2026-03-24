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
      execute: vi.fn().mockResolvedValue({ rows: [{ estimate: 1000 }] }),
      select: vi.fn().mockReturnValue(mockChain),
    },
  };
});

vi.mock("next/cache", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
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
    // Setup sequential mocks
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;

    // First call (IDs)
    mockSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([{ id: 1 }]),
    });

    // Second call (Content)
    mockSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
    });

    await getArticlesOnThisDay(1, 1);

    // Check second call
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    const selectCall = (db.select as any).mock.calls[1][0];

    // Check that content is defined in the selection
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(selectCall.content).toBeDefined();

    /*
     * With optimization, it should NOT be the raw column object.
     * Without optimization, it IS the raw column object (from getTableColumns spread).
     */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(selectCall.content).not.toBe(articles.content);

    /*
     * Verify plainText is already optimized (substring)
     * So it should NOT be the raw column object
     */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(selectCall.plainText).not.toBe(articles.plainText);
  });
});
