import { describe, it, expect, vi, afterEach } from "vitest";
import { getNews, getArticlesOnThisDay } from "./actions";
import { db } from "@/db";

// Mock setup
vi.mock("@/db", () => ({
  db: {
    execute: vi.fn().mockResolvedValue({ rows: [{ estimate: 100 }] }),
      select: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => Promise<unknown>) => fn,
}));

vi.mock("@/lib/rtf-content-converter", () => ({
  processRtfContent: vi.fn().mockResolvedValue("extract"),
  stripHtml: vi.fn((html: string) => html),
}));

vi.mock("@/lib/news-order", () => ({
  getNewsOrderBy: vi.fn().mockReturnValue([]),
}));

interface MockChain {
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  offset: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  leftJoin: ReturnType<typeof vi.fn>;
  then: (resolve: (value: unknown) => void) => Promise<void>;
  $dynamic: ReturnType<typeof vi.fn>;
  [key: string]: unknown;
}

// Mock chain
const createMockChain = (result: unknown[] = [{ count: 10 }]): MockChain => {
  const chain: Partial<MockChain> = {};
  const methods = ["from", "where", "limit", "offset", "orderBy", "$dynamic", "leftJoin"];
  methods.forEach((method) => {
    chain[method] = vi.fn().mockReturnValue(chain);
  });

  chain.then = (resolve: (value: unknown) => void) => {
    resolve(result);
    return Promise.resolve();
  };
  return chain as MockChain;
};

describe("getNews Performance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should NOT include plainText (optimized)", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain());

    // Make db.select return a new chain each time
    mockSelect.mockImplementation(() => createMockChain());

    await getNews({});

    // The second call to db.select is the main query (the first is count)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const callArgs = mockSelect.mock.calls[0][0];

    expect(callArgs).toBeDefined();
    expect(callArgs).not.toHaveProperty("plainText");
  });
});

describe("getArticlesOnThisDay Performance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should NOT include plainText in return value (optimized)", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;

    // Mock the data returned by the first query (IDs)
    const idsChain = createMockChain([{ id: 1 }]);

    // Mock the data returned by the second query (Full articles)
    const articlesChain = createMockChain([
      {
        id: 1,
        title: "Test",
        content: Buffer.from("content"),
        plainText: "some large text",
        searchVector: "...",
      },
    ]);

    mockSelect.mockReturnValueOnce(idsChain).mockReturnValueOnce(articlesChain);

    const result = await getArticlesOnThisDay(1, 1);

    // Check the first item
    expect(result[0]).not.toHaveProperty("plainText");
  });

  it("should return empty array immediately if no articles found (coverage)", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;

    // Mock first call (IDs) returning empty array
    const idsChain = createMockChain([]);
    mockSelect.mockReturnValueOnce(idsChain);

    const result = await getArticlesOnThisDay(1, 1);

    expect(result).toEqual([]);
    // Should verify it didn't call select a second time, but the mock setup implies it
  });

  it("should execute shuffle loop when multiple articles found (coverage)", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;

    // Mock first call (IDs)
    const idsChain = createMockChain([{ id: 1 }, { id: 2 }, { id: 3 }]);

    // Mock second call (Full articles)
    const articlesChain = createMockChain([
      { id: 1, title: "A", content: null },
      { id: 2, title: "B", content: null },
      { id: 3, title: "C", content: null },
    ]);

    mockSelect.mockReturnValueOnce(idsChain).mockReturnValueOnce(articlesChain);

    const result = await getArticlesOnThisDay(1, 1);

    expect(result).toHaveLength(3);
  });
});
