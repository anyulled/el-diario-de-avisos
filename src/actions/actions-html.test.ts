import { describe, it, expect, vi, afterEach } from "vitest";
import { getArticleHtml } from "./actions";
import { db } from "@/db";
import * as rtfHtmlConverter from "@/lib/rtf-html-converter";

// Mock dependencies
vi.mock("next/cache", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
  unstable_cache: (fn: any) => fn,
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("@/lib/rtf-html-converter", () => ({
  processRtfContent: vi.fn(),
}));

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
// Mock helper
const createMockChain = (result: any[]) => {
  const chain: any = {};
  chain.from = vi.fn().mockReturnValue(chain);
  chain.leftJoin = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return chain;
};
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */

describe("getArticleHtml", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns processed HTML for valid article content", async () => {
    const mockContent = Buffer.from("mock content");
    const mockArticle = { content: mockContent };

    // Mock DB response
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain([mockArticle]));

    // Mock RTF conversion
    vi.mocked(rtfHtmlConverter.processRtfContent).mockResolvedValue("<p>HTML Content</p>");

    const result = await getArticleHtml(1);

    expect(result).toBe("<p>HTML Content</p>");

    /**
     * GetCachedArticle converts buffer to base64 string, and getArticleHtml converts it back.
     * So processRtfContent receives a Buffer (which is what we expect).
     * The content of the buffer should be the same as mockContent.
     */
    expect(rtfHtmlConverter.processRtfContent).toHaveBeenCalledWith(
      expect.objectContaining(mockContent),
      1,
    );
  });

  it("returns empty string if article content is missing", async () => {
    // Mock DB response
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain([]));

    const result = await getArticleHtml(1);

    expect(result).toBe("");
  });
});
