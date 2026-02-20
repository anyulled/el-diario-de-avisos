import { describe, it, expect, vi, afterEach } from "vitest";
import { getArticlesOnThisDay } from "./actions";
import { db } from "@/db";

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

describe("getArticlesOnThisDay Columns Optimization", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should select only necessary columns", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    const mockChain = {
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
    };
    mockSelect.mockReturnValue(mockChain);

    await getArticlesOnThisDay(1, 1);

    const selection = mockSelect.mock.calls[0][0];
    const selectedKeys = Object.keys(selection);

    // Expected columns
    const expected = ["id", "title", "subtitle", "date", "publicationYear", "plainText", "content", "publicationName"];

    expect(selectedKeys).toEqual(expect.arrayContaining(expected));

    // Check for some columns that should NOT be there
    const forbidden = ["cota", "code2", "authorId", "isEditable", "observations", "publicationMonth", "issueNumber", "series", "microfilm"];

    forbidden.forEach(key => {
        expect(selectedKeys).not.toContain(key);
    });
  });
});
