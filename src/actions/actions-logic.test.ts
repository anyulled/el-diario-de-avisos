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
  processRtfContent: vi.fn().mockResolvedValue("extract from rtf"),
  // Implement actual logic for stripHtml to test the flow
  stripHtml: vi.fn((html: string) => `stripped: ${html}`),
}));

describe("getArticlesOnThisDay Logic", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createMockChain = (data: any[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain: any = {};
    const methods = ["from", "leftJoin", "where", "orderBy", "limit"];
    methods.forEach((method) => {
      chain[method] = vi.fn().mockReturnValue(chain);
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chain.then = (resolve: any) => {
        resolve(data);
        return Promise.resolve();
    };
    return chain;
  };

  it("should use plainText when available", async () => {
    const mockData = [
      { id: 1, plainText: "Simple text", content: null },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.select as any).mockReturnValue(createMockChain(mockData));

    const result = await getArticlesOnThisDay(1, 1);

    expect(result).toHaveLength(1);
    expect(result[0].extract).toBe("stripped: Simple text");
  });

  it("should fall back to processing content when plainText is missing", async () => {
    const mockData = [
      { id: 2, plainText: null, content: Buffer.from("rtf") },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db.select as any).mockReturnValue(createMockChain(mockData));

    const result = await getArticlesOnThisDay(1, 1);

    expect(result).toHaveLength(1);
    expect(result[0].extract).toBe("extract from rtf");
  });
});
