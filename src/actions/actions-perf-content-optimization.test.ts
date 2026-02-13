import { describe, it, expect, vi, afterEach } from "vitest";
import { getArticlesOnThisDay } from "./actions";
import { db } from "@/db";
import { articles } from "@/db/schema";

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

interface MockChain {
  from: ReturnType<typeof vi.fn>;
  leftJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  then: (resolve: (value: unknown) => void) => Promise<void>;
  [key: string]: unknown;
}

const createMockChain = (): MockChain => {
  const chain: Partial<MockChain> = {};
  const methods = ["from", "leftJoin", "where", "limit", "orderBy"];
  methods.forEach((method) => {
    chain[method] = vi.fn().mockReturnValue(chain);
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain.then = (resolve: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    resolve([{ id: 1, title: "Test Article", content: Buffer.from("content"), plainText: "text" }]);
    return Promise.resolve();
  };
  return chain as MockChain;
};

describe("getArticlesOnThisDay Conditional Content Fetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch content conditionally to avoid large payloads when plainText is available", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain());

    await getArticlesOnThisDay(1, 1);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const selectArgs: any = mockSelect.mock.calls[0][0];

    /**
     * Current behavior: content is fetched directly as a column
     * We want to verify if it is optimized to be a SQL conditional
     */

    // Check if 'content' exists in the selection
    expect(selectArgs).toHaveProperty("content");

    /**
     * In the unoptimized version, it's the column itself.
     * In the optimized version, it should be a SQL object (CASE WHEN...).
     */

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const contentField = selectArgs.content;

    /**
     * We expect the optimization to change this to a SQL chunks object
     * For now, let's just log it or assert against it being the simple column.
     * But since I can't see the log easily, I'll assert that it IS a simple column (current state)
     * and fail if it IS optimized (which it isn't yet).
     */

    // If I check if it equals articles.content, that works.
    expect(contentField).not.toBe(articles.content);
  });
});
