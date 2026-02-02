import { describe, it, expect, vi, afterEach } from "vitest";
import { getNews, getArticlesOnThisDay } from "./actions";
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

vi.mock("@/lib/news-order", () => ({
  getNewsOrderBy: vi.fn().mockReturnValue([]),
}));

interface MockChain {
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  offset: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  then: (resolve: (value: unknown) => void) => Promise<void>;
  $dynamic: ReturnType<typeof vi.fn>;
  [key: string]: unknown;
}

// Mock chain
const createMockChain = (): MockChain => {
  const chain: Partial<MockChain> = {};
  const methods = ["from", "where", "limit", "offset", "orderBy", "$dynamic"];
  methods.forEach((method) => {
    chain[method] = vi.fn().mockReturnValue(chain);
  });
  // Mocking then to resolve
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain.then = (resolve: any) => {
    // Return empty array for query results
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    resolve([{ count: 10 }]); // For count query, or data query.
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
    const callArgs = mockSelect.mock.calls[1][0];

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
    const chain = createMockChain();

    // Mock the data returned by the query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chain.then = (resolve: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      resolve([
        {
            id: 1,
            title: "Test",
            content: Buffer.from("content"),
            plainText: "some large text",
            searchVector: "..."
        }
      ]);
      return Promise.resolve();
    };

    mockSelect.mockReturnValue(chain);

    const result = await getArticlesOnThisDay(1, 1);

    // Check the first item
    expect(result[0]).not.toHaveProperty("plainText");
  });
});
