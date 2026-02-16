import { describe, it, expect, vi, afterEach } from "vitest";
import { getArticlesOnThisDay } from "./actions";
import { db } from "@/db";
import { processRtfContent, stripHtml } from "@/lib/rtf-content-converter";

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
  stripHtml: vi.fn((html: string) => `stripped ${html}`),
}));

interface MockChain {
  from: ReturnType<typeof vi.fn>;
  leftJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  then: (resolve: (value: unknown) => void) => Promise<void>;
  catch: ReturnType<typeof vi.fn>;
  finally: ReturnType<typeof vi.fn>;
  $dynamic: ReturnType<typeof vi.fn>;
  [key: string]: unknown;
}

// Mock chain
const createMockChain = (data: unknown[]): MockChain => {
  const chain: Partial<MockChain> = {};
  const methods = ["from", "leftJoin", "where", "limit", "orderBy", "catch", "finally", "$dynamic"];
  methods.forEach((method) => {
    chain[method] = vi.fn().mockReturnValue(chain);
  });
  // Mocking then to resolve
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain.then = (resolve: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    resolve(data);
    return Promise.resolve();
  };
  return chain as MockChain;
};

describe("getArticlesOnThisDay Optimization", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should select content conditionally and structure query correctly", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain([]));

    await getArticlesOnThisDay(1, 1);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const callArgs = mockSelect.mock.calls[0][0];

    expect(callArgs).toBeDefined();
    expect(callArgs).toHaveProperty("content");
    // Drizzle SQL objects created with sql`` template tag contain queryChunks
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(callArgs.content).toHaveProperty("queryChunks");
  });

  it("should use stripHtml when plainText is available", async () => {
    const mockData = [
      {
        id: 1,
        title: "Test Article",
        plainText: "Some <b>HTML</b> text",
        content: null,
      },
    ];
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain(mockData));

    const result = await getArticlesOnThisDay(1, 1);

    expect(stripHtml).toHaveBeenCalledWith("Some <b>HTML</b> text");
    expect(processRtfContent).not.toHaveBeenCalled();
    expect(result[0].extract).toContain("stripped Some <b>HTML</b> text");
  });

  it("should use processRtfContent when plainText is missing", async () => {
    const mockData = [
      {
        id: 1,
        title: "Test Article",
        plainText: null,
        content: Buffer.from("rtf content"),
      },
    ];
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain(mockData));

    const result = await getArticlesOnThisDay(1, 1);

    expect(processRtfContent).toHaveBeenCalled();
    expect(result[0].extract).toBe("extract from rtf");
  });
});
