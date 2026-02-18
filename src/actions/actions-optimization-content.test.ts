import { describe, it, expect, vi, afterEach } from "vitest";
import { getArticlesOnThisDay } from "./actions";
import { db } from "@/db";
import { processRtfContent } from "@/lib/rtf-content-converter";

// Mock setup
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  unstable_cache: <T>(fn: T) => fn,
}));

vi.mock("@/lib/rtf-content-converter", () => ({
  processRtfContent: vi.fn().mockResolvedValue("processed extract"),
  stripHtml: vi.fn((html: string) => html),
}));

interface MockChain {
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  leftJoin: ReturnType<typeof vi.fn>;
  then: (resolve: (value: unknown) => void) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createMockChain = (returnData: any[]): MockChain => {
  const chain: Partial<MockChain> = {};
  const methods = ["from", "where", "limit", "orderBy", "leftJoin"] as const;
  methods.forEach((method) => {
    chain[method] = vi.fn().mockReturnValue(chain);
  });
  chain.then = (resolve: (value: unknown) => void) => {
    resolve(returnData);
    return Promise.resolve();
  };
  return chain as MockChain;
};

describe("getArticlesOnThisDay Content Optimization", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should handle null content when plainText is available (conditional fetch)", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(
      createMockChain([
        {
          id: 1,
          // Simulating content being excluded by SQL optimization
          content: null,
          plainText: "Pre-computed text",
          title: "Test Article",
          groupName: "Test Group",
        },
      ]),
    );

    const result = await getArticlesOnThisDay(1, 1);

    expect(result[0].extract).toBe("Pre-computed text");
    expect(processRtfContent).not.toHaveBeenCalled();
    expect(result[0].title).toBe("Test Article");
  });

  it("should fallback to content when plainText is null", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(
      createMockChain([
        {
          id: 1,
          content: Buffer.from("rtf content"),
          plainText: null,
          title: "Test Article",
        },
      ]),
    );

    const result = await getArticlesOnThisDay(1, 1);

    expect(result[0].extract).toBe("processed extract");
    expect(processRtfContent).toHaveBeenCalled();
  });
});
