import { describe, it, expect, vi, beforeEach } from "vitest";
import { getArticlesOnThisDay } from "./actions";
import { db } from "@/db";

// Mock DB
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock cache
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => Promise<unknown>) => fn,
}));

// Mock rtf-content-converter
vi.mock("@/lib/rtf-content-converter", () => ({
  processRtfContent: vi.fn().mockResolvedValue("Processed Content"),
  stripHtml: (html: string) => html.replace(/<[^>]*>/g, ""),
}));

describe("getArticlesOnThisDay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should strip HTML tags from plainText", async () => {
    const mockArticles = [
      {
        id: 1,
        title: "Article 1",
        plainText: "This is <i>italic</i> and <b>bold</b>.",
        content: null,
      },
    ];

    const mockSelect = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue(mockArticles),
          }),
        }),
      }),
    });

    vi.mocked(db.select).mockImplementation(mockSelect as unknown as typeof db.select);

    const result = await getArticlesOnThisDay(1, 1);

    expect(result[0].extract).toBe("This is italic and bold.");
  });
});
