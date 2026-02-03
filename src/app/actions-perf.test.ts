import { describe, it, expect, vi, afterEach } from "vitest";
import { getArticleById, getArticlesOnThisDay } from "./actions";
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
}));

interface MockChain {
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  then: (resolve: (value: unknown) => void) => Promise<void>;
  catch: ReturnType<typeof vi.fn>;
  finally: ReturnType<typeof vi.fn>;
  [key: string]: unknown;
}

// Mock chain
const createMockChain = (): MockChain => {
  const chain: Partial<MockChain> = {};
  const methods = ["from", "leftJoin", "where", "limit", "orderBy", "catch", "finally"];
  methods.forEach((method) => {
    chain[method] = vi.fn().mockReturnValue(chain);
  });
  // Mocking then to resolve
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain.then = (resolve: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    resolve([{ id: 1, title: "Test Article", content: Buffer.from("content") }]);
    return Promise.resolve();
  };
  return chain as MockChain;
};

describe("getArticleById Performance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should exclude searchVector from the query", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain());

    await getArticleById(1);

    /**
     * Capture the arguments passed to db.select
     * Currently, it is called with no arguments (undefined)
     * We expect it to be called with an object representing the columns
     */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const callArgs = mockSelect.mock.calls[0][0];

    expect(callArgs).toBeDefined();
    expect(callArgs).not.toHaveProperty("searchVector");
  });

  it("should exclude plainText from the query", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain());

    await getArticleById(1);

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

  it("should exclude searchVector from the query", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain());

    await getArticlesOnThisDay(1, 1);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const callArgs = mockSelect.mock.calls[0][0];

    expect(callArgs).toBeDefined();
    expect(callArgs).not.toHaveProperty("searchVector");
  });
});
