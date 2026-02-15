import { describe, it, expect, vi, afterEach } from "vitest";
import { getArticlesOnThisDay } from "./actions";
import { db } from "@/db";

// Mock setup
vi.mock("@/db", () => ({
  db: {
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

describe("getArticlesOnThisDay Optimization", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should conditionally select content based on plainText (optimization)", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;

    // Mock return value structure
    mockSelect.mockReturnValue(createMockChain([{
      id: 1,
      content: Buffer.from("content"),
      plainText: "snippet",
    }]));

    await getArticlesOnThisDay(1, 1);

    // Get the arguments passed to db.select
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const selectArgs = mockSelect.mock.calls[0][0];

    expect(selectArgs).toBeDefined();

    /**
     * Check 'content' field in the selection
     * Before optimization: it's a simple column (implied by spread)
     * After optimization: it should be a SQL chunk (from sql`CASE...`)
     *
     * We expect it to be a SQL object, which typically has 'queryChunks' in Drizzle
     */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(selectArgs.content).toHaveProperty("queryChunks");

    // Also check plainText is still optimized (substring)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(selectArgs.plainText).toHaveProperty("queryChunks");
  });

  it("should handle null plainText by processing content (fallback)", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;

    mockSelect.mockReturnValue(createMockChain([{
      id: 1,
      content: Buffer.from("rtf content"),
      plainText: null,
    }]));

    const result = await getArticlesOnThisDay(1, 1);

    expect(result).toHaveLength(1);
    expect(result[0].extract).toBe("extract");
  });

  it("should use plainText when present (optimized path)", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;

    mockSelect.mockReturnValue(createMockChain([{
      id: 1,
      content: null,
      plainText: "snippet",
    }]));

    const result = await getArticlesOnThisDay(1, 1);

    expect(result).toHaveLength(1);
    // StripHtml mock returns input
    expect(result[0].extract).toBe("snippet");
  });
});
