import { describe, it, expect, vi, afterEach } from "vitest";
import { getArticlesOnThisDay } from "./actions";
import { db } from "@/db";

vi.mock("@/db", () => ({
  db: {
    execute: vi.fn().mockResolvedValue({ rows: [{ estimate: 100 }] }),
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

    // First call (IDs)
    const idsChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([{ id: 1 }]),
    };

    // Second call (Full details)
    const detailsChain = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };

    mockSelect.mockReturnValueOnce(idsChain).mockReturnValueOnce(detailsChain);

    await getArticlesOnThisDay(1, 1);

    // Check the second call (index 1) which selects the details
    const selection = mockSelect.mock.calls[1][0] as Record<string, unknown>;
    const selectedKeys = Object.keys(selection);

    // Expected columns
    const expected = ["id", "title", "subtitle", "date", "publicationYear", "plainText", "content", "publicationName"];

    /**
     * The selection object keys will include the aliases used in the query
     * We iterate over expected keys and verify they exist in the selection object
     */
    expected.forEach((key) => {
      expect(selection).toHaveProperty(key);
    });

    // Check for some columns that should NOT be there
    const forbidden = [
      "cota",
      "code2",
      "authorId",
      "isEditable",
      "observations",
      "publicationMonth",
      "issueNumber",
      "series",
      "microfilm",
    ];

    forbidden.forEach((key) => {
      expect(selectedKeys).not.toContain(key);
    });
  });
});
