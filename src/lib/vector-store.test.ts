import { beforeEach, describe, expect, it, vi } from "vitest";
import * as ai from "./ai";
import { findSimilarArticles } from "./vector-store";

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
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResults),
      } as any);

      // Improved mock implementation for db.select to handle different types of queries
      vi.mocked(db.select).mockImplementation((selection: any) => {
        // Safe check for content fetch without JSON.stringify circular Drizzle objects
        const isContentFetch = selection && selection.content !== undefined;

        const mockQuery = {
          from: vi.fn().mockReturnThis(),
          innerJoin: vi.fn().mockReturnThis(),
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
        return mockQuery as any;
      });

      const results = await findSimilarArticles("test query", 1);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe(1);
      expect(results[0].contentSnippet).toBeDefined();
    });
  });
});
