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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unstable_cache: (fn: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return fn;
  },
}));

vi.mock("@/lib/rtf-content-converter", () => ({
  processRtfContent: vi.fn().mockResolvedValue("extract"),
  stripHtml: vi.fn((html: string) => html),
}));

vi.mock("@/lib/news-order", () => ({
  getNewsOrderBy: vi.fn().mockReturnValue([]),
}));

// Mock chain
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const createMockChain = (result: unknown[] = [{ count: 10 }]): unknown => {
  const chain: Record<string, unknown> = {};
  const methods = ["from", "where", "limit", "offset", "orderBy", "$dynamic", "leftJoin"];
  methods.forEach((method) => {
    chain[method] = vi.fn().mockReturnValue(chain);
  });

  chain.then = (resolve: (value: unknown) => void) => {
    resolve(result);
    return Promise.resolve();
  };
  return chain;
};

describe("getArticlesOnThisDay Performance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should NOT include plainText in return value (optimized)", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;

    // Mock the data returned by the query
    const chain = createMockChain([
      {
        id: 1,
        title: "Test",
        content: Buffer.from("content"),
        plainText: "some large text",
        searchVector: "...",
      },
    ]);

    mockSelect.mockReturnValue(chain);

    const result = await getArticlesOnThisDay(1, 1);

    // Check the first item
    expect(result[0]).not.toHaveProperty("plainText");
  });
});
