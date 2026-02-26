import { describe, it, expect, vi, afterEach } from "vitest";
import { getEssayHtml } from "./actions";
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

describe("getEssayHtml", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns processed HTML for valid essay content", async () => {
    const mockContent = Buffer.from("mock content");
    const mockEssay = { content: mockContent };

    // Mock DB response
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain([mockEssay]));

    // Mock RTF conversion
    vi.mocked(rtfHtmlConverter.processRtfContent).mockResolvedValue("<p>HTML Content</p>");

    const result = await getEssayHtml(1);

    expect(result).toBe("<p>HTML Content</p>");

    /**
     * The processed buffer should be passed to the converter.
     */
    expect(rtfHtmlConverter.processRtfContent).toHaveBeenCalledWith(
      expect.objectContaining(mockContent),
      1,
    );
  });

  it("fetches only content column from database", async () => {
    const mockContent = Buffer.from("mock content");
    const mockEssay = { content: mockContent };

    // Mock DB response
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain([mockEssay]));

    await getEssayHtml(1);

    // Verify select was called with specific columns
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const selectCall = (db.select as any).mock.calls[0][0] as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    expect(selectCall).toEqual({ content: expect.anything() });
  });

  it("returns empty string if essay content is missing", async () => {
    // Mock DB response
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain([]));

    const result = await getEssayHtml(1);

    expect(result).toBe("");
  });
});
