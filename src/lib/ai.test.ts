// Mock the Google Generative AI module BEFORE importing
vi.mock("@google/generative-ai", () => {
  // Set env var before module loads
  process.env.GEMINI_KEY = "test-gemini-key";

  const mockEmbedContent = vi.fn();
  const mockBatchEmbedContents = vi.fn();

  class MockGoogleGenerativeAI {
    constructor() {
      // Constructor can be empty or take arguments if needed for the mock
    }
    getGenerativeModel() {
      return {
        embedContent: mockEmbedContent,
        batchEmbedContents: mockBatchEmbedContents,
      };
    }
  }

  return {
    GoogleGenerativeAI: MockGoogleGenerativeAI,
  };
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateEmbedding, generateEmbeddingsBatch } from "./ai";

describe("AI Embedding Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateEmbedding", () => {
    it("should generate embeddings for a single text", async () => {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const mockModel = new GoogleGenerativeAI("test-key").getGenerativeModel({
        model: "text-embedding-004",
      });

      const mockEmbedding = {
        embedding: {
          values: [0.1, 0.2, 0.3, 0.4, 0.5],
        },
      };

      vi.mocked(mockModel.embedContent).mockResolvedValue(mockEmbedding);

      const result = await generateEmbedding("test text");

      expect(result).toEqual([0.1, 0.2, 0.3, 0.4, 0.5]);
      expect(mockModel.embedContent).toHaveBeenCalledWith({
        content: { role: "user", parts: [{ text: "test text" }] },
      });
    });

    it("should handle empty text", async () => {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const mockModel = new GoogleGenerativeAI("test-key").getGenerativeModel({
        model: "text-embedding-004",
      });

      const mockEmbedding = {
        embedding: {
          values: [],
        },
      };

      vi.mocked(mockModel.embedContent).mockResolvedValue(mockEmbedding);

      const result = await generateEmbedding("");

      expect(result).toEqual([]);
      expect(mockModel.embedContent).toHaveBeenCalledWith({
        content: { role: "user", parts: [{ text: "" }] },
      });
    });

    it("should throw error when API fails", async () => {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const mockModel = new GoogleGenerativeAI("test-key").getGenerativeModel({
        model: "text-embedding-004",
      });

      vi.mocked(mockModel.embedContent).mockRejectedValue(new Error("API Error"));

      await expect(generateEmbedding("test")).rejects.toThrow("API Error");
    });
  });

  describe("generateEmbeddingsBatch", () => {
    it("should generate embeddings for multiple texts", async () => {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const mockModel = new GoogleGenerativeAI("test-key").getGenerativeModel({
        model: "text-embedding-004",
      });

      const mockBatchResult = {
        embeddings: [{ values: [0.1, 0.2, 0.3] }, { values: [0.4, 0.5, 0.6] }, { values: [0.7, 0.8, 0.9] }],
      };

      vi.mocked(mockModel.batchEmbedContents).mockResolvedValue(mockBatchResult);

      const texts = ["text 1", "text 2", "text 3"];
      const result = await generateEmbeddingsBatch(texts);

      expect(result).toEqual([
        [0.1, 0.2, 0.3],
        [0.4, 0.5, 0.6],
        [0.7, 0.8, 0.9],
      ]);

      expect(mockModel.batchEmbedContents).toHaveBeenCalledWith({
        requests: [
          {
            content: { role: "user", parts: [{ text: "text 1" }] },
            model: "models/text-embedding-004",
          },
          {
            content: { role: "user", parts: [{ text: "text 2" }] },
            model: "models/text-embedding-004",
          },
          {
            content: { role: "user", parts: [{ text: "text 3" }] },
            model: "models/text-embedding-004",
          },
        ],
      });
    });

    it("should handle empty array", async () => {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const mockModel = new GoogleGenerativeAI("test-key").getGenerativeModel({
        model: "text-embedding-004",
      });

      const mockBatchResult = {
        embeddings: [],
      };

      vi.mocked(mockModel.batchEmbedContents).mockResolvedValue(mockBatchResult);

      const result = await generateEmbeddingsBatch([]);

      expect(result).toEqual([]);
    });

    it("should throw error when batch API fails", async () => {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const mockModel = new GoogleGenerativeAI("test-key").getGenerativeModel({
        model: "text-embedding-004",
      });

      vi.mocked(mockModel.batchEmbedContents).mockRejectedValue(new Error("Batch API Error"));

      await expect(generateEmbeddingsBatch(["test"])).rejects.toThrow("Batch API Error");
    });
  });
});
