import { describe, it, expect, vi, afterEach } from "vitest";
import { getNews } from "./actions";
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

describe("getNews Column Optimization", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should verify that getNews selects only the required columns", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain());

    // Make db.select return a new chain each time
    mockSelect.mockImplementation(() => createMockChain());

    await getNews({});

    // The second call to db.select is the main query (the first is count)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const callArgs = mockSelect.mock.calls[1][0];

    expect(callArgs).toBeDefined();

    // Required columns
    expect(callArgs).toHaveProperty("id");
    expect(callArgs).toHaveProperty("title");
    expect(callArgs).toHaveProperty("subtitle");
    expect(callArgs).toHaveProperty("date");
    expect(callArgs).toHaveProperty("publicationYear");
    expect(callArgs).toHaveProperty("page");

    // Columns to remove (optimization)
    expect(callArgs).not.toHaveProperty("columnId");
    expect(callArgs).not.toHaveProperty("pubId");
    expect(callArgs).not.toHaveProperty("issueId");
    expect(callArgs).not.toHaveProperty("dateOld");
    expect(callArgs).not.toHaveProperty("cota");
    expect(callArgs).not.toHaveProperty("code2");
    expect(callArgs).not.toHaveProperty("authorId");
    expect(callArgs).not.toHaveProperty("isEditable");
    expect(callArgs).not.toHaveProperty("observations");
    expect(callArgs).not.toHaveProperty("publicationMonth");
    expect(callArgs).not.toHaveProperty("issueNumber");
    expect(callArgs).not.toHaveProperty("series");
    expect(callArgs).not.toHaveProperty("microfilm");
  });
});
