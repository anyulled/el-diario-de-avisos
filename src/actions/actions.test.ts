import { describe, it, expect, vi, afterEach } from "vitest";
import { getArticlesOnThisDay, getNews, getArticleById, getEssays, getEssayById } from "./actions";
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

vi.mock("@/lib/date-range", () => ({
  normalizeDateRange: vi.fn().mockReturnValue({ start: null, end: null, isValidRange: false }),
}));

// Mock chain
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

describe("Server Actions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getNews", () => {
    it("should fetch news with pagination", async () => {
        const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
        // First call for count, second for data
        mockSelect
            .mockReturnValueOnce(createMockChain([{ count: 20 }]))
            .mockReturnValueOnce(createMockChain([{ id: 1, title: "Article 1" }]));

        const result = await getNews({ page: 1 });
        expect(result.total).toBe(20);
        expect(result.data).toHaveLength(1);
    });
  });

  describe("getArticleById", () => {
    it("should fetch article by id and handle buffer content", async () => {
        const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
        const mockContent = Buffer.from("test");
        mockSelect.mockReturnValue(createMockChain([{
            id: 1,
            title: "Article 1",
            content: mockContent,
            plainText: "text"
        }]));

        const result = await getArticleById(1);
        expect(result).toBeDefined();
        if (result) {
            expect(result.id).toBe(1);
            // Unstable_cache serialization check handling
            expect(Buffer.isBuffer(result.content)).toBe(true);
        }
    });

    it("should return null if not found", async () => {
        const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
        mockSelect.mockReturnValue(createMockChain([]));

        const result = await getArticleById(999);
        expect(result).toBeUndefined();
    });
  });

  describe("getEssays", () => {
      it("should fetch list of essays", async () => {
          const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
          mockSelect.mockReturnValue(createMockChain([{ id: 1, title: "Essay 1", groupName: "Pub 1" }]));

          const result = await getEssays();
          expect(result).toHaveLength(1);
          expect(result[0].title).toBe("Essay 1");
      });
  });

  describe("getEssayById", () => {
      it("should fetch essay by id", async () => {
          const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
          mockSelect.mockReturnValue(createMockChain([{ id: 1, title: "Essay 1", content: Buffer.from("content") }]));

          const result = await getEssayById(1);
          expect(result).toBeDefined();
          if (result) {
              expect(result.title).toBe("Essay 1");
          }
      });
  });

  describe("getArticlesOnThisDay Performance", () => {
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
});
