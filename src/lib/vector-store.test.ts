import { beforeEach, describe, expect, it, vi } from "vitest";
import * as ai from "./ai";
import { findSimilarArticles } from "./vector-store";
import { db } from "@/db";

// Mock the AI module
vi.mock("./ai", () => ({
  generateEmbedding: vi.fn(),
}));

// Mock the database
vi.mock("@/db", () => {
  const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn(() => Promise.resolve([])),
  };

  return {
    db: {
      select: vi.fn(() => mockQueryBuilder),
    },
  };
});

describe("vector-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findSimilarArticles", () => {
    it("should generate embedding only once for both article and essay searches", async () => {
      const mockEmbedding = new Array(1536).fill(0.1);
      vi.mocked(ai.generateEmbedding).mockResolvedValue(mockEmbedding);

      await findSimilarArticles("test query", 5);

      // Verify generateEmbedding was called exactly once
      expect(ai.generateEmbedding).toHaveBeenCalledTimes(1);
      expect(ai.generateEmbedding).toHaveBeenCalledWith("test query");
    });

    it("should reuse the same embedding for multiple vector searches", async () => {
      const mockEmbedding = new Array(1536).fill(0.2);
      vi.mocked(ai.generateEmbedding).mockResolvedValue(mockEmbedding);

      await findSimilarArticles("another query", 10);

      // Verify the embedding is generated only once despite multiple searches
      expect(ai.generateEmbedding).toHaveBeenCalledTimes(1);
      expect(ai.generateEmbedding).toHaveBeenCalledWith("another query");
    });

    it("should process results when data is found in database", async () => {
      const mockEmbedding = new Array(1536).fill(0.1);
      vi.mocked(ai.generateEmbedding).mockResolvedValue(mockEmbedding);

      // Mock DB results for vector and keyword search
      const mockResults = [{ id: 1, title: "Article 1", date: "2024-01-01", similarity: 0.9 }];

      // Re-mock DB specifically for this test to return data
      const { db } = await import("@/db");

      interface MockQueryBuilder {
        from: ReturnType<typeof vi.fn>;
        innerJoin: ReturnType<typeof vi.fn>;
        leftJoin: ReturnType<typeof vi.fn>;
        where: ReturnType<typeof vi.fn>;
        orderBy: ReturnType<typeof vi.fn>;
        limit: ReturnType<typeof vi.fn>;
      }

      const mockQueryBuilder: MockQueryBuilder = {
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResults),
      };

      vi.mocked(db.select).mockReturnValue(mockQueryBuilder as unknown as ReturnType<typeof db.select>);

      // Improved mock implementation for db.select to handle different types of queries
      vi.mocked(db.select).mockImplementation(((selection: { content?: unknown } | undefined) => {
        // Safe check for content fetch without JSON.stringify circular Drizzle objects
        const isContentFetch = selection && selection.content !== undefined;

        const mockQuery = {
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
          leftJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockImplementation(() => {
            if (isContentFetch) {
              return Promise.resolve([{ id: 1, content: Buffer.from("Test content") }]);
            }
            return {
              orderBy: vi.fn().mockReturnThis(),
              limit: vi.fn().mockResolvedValue(mockResults),
            };
          }),
        };
        return mockQuery as unknown as ReturnType<typeof db.select>;
      }) as unknown as typeof db.select);

      const results = await findSimilarArticles("test query", 1);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe(1);
      expect(results[0].contentSnippet).toBeDefined();
    });

    it("should include keyword results for articles", async () => {

      const mockEmbedding = new Array(1536).fill(0.1);
      vi.mocked(ai.generateEmbedding).mockResolvedValue(mockEmbedding);
      const mockResult = { id: 2, title: "Keyword Match", date: "2024-01-01", similarity: 0.8 };

      // Better mock for Drizzle's thenable query builder
      const mockQuery: any = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((onFullfilled) => Promise.resolve([mockResult]).then(onFullfilled))
      };

      vi.mocked(db.select).mockReturnValue(mockQuery);

      const results = await findSimilarArticles("test", 1);
      expect(results.some(r => r.id === 2)).toBe(true);
    });
  });
});
