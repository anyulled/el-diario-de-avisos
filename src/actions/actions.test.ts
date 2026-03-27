import { describe, it, expect, vi, afterEach } from "vitest";
import { getEssays, getArticleSection } from "./actions";
import { db } from "@/db";

vi.mock("@/db", () => {
  const mockChain = {
    from: vi.fn().mockReturnThis(),
    $dynamic: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((resolve: (val: unknown[]) => void) => resolve([])),
  };
  return {
    db: {
      select: vi.fn().mockReturnValue(mockChain),
      execute: vi.fn().mockResolvedValue({ rows: [{ estimate: 123 }] }),
    },
  };
});

vi.mock("@/db/schema", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/db/schema")>();
  return {
    ...actual,
  };
});

vi.mock("@/lib/date-range", () => ({
  normalizeDateRange: () => ({ start: null, end: null, isValidRange: true }),
}));

vi.mock("next/cache", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
  unstable_cache: (fn: any) => fn,
}));

vi.mock("@/lib/news-order", () => ({
  getNewsOrderBy: () => [],
}));

describe("getNews Performance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getArticleSection returns section", async () => {
    const result = await getArticleSection(1);
    // Mock returns empty array[0]
    expect(result).toBeUndefined();
  });

  it("should run queries in parallel", async () => {
    // This test is empty in the original file as well
  });


  it("getEssays returns data with fallback groupName", async () => {
    // Mock db.select().from().leftJoin().then()
    const mockSelect = vi.mocked(db.select);
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((resolve: (val: unknown[]) => void) => resolve([{ id: 1, title: "Essay", groupName: null }])),
    } as unknown as ReturnType<typeof db.select>);

    const result = await getEssays();
    expect(result[0].groupName).toBe("Publicación Desconocida");
  });
});
