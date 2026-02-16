import { describe, it, expect, vi } from "vitest";
import { processRtfContent, stripHtml } from "./rtf-content-converter";

/* eslint-disable @typescript-eslint/no-unsafe-return */
vi.mock("./rtf-encoding-handler", () => ({
  decodeBuffer: vi.fn((buf: { toString: () => string }) => buf.toString()),
  repairMojibake: vi.fn((str) => str),
  unescapeRtfHex: vi.fn((str) => str),
  rtfToHtml: vi.fn().mockResolvedValue("<html><body>test</body></html>"),
}));
/* eslint-enable @typescript-eslint/no-unsafe-return */

describe("rtf-content-converter", () => {
  describe("stripHtml", () => {
    it("should strip HTML tags", () => {
      const html = "<p>Hello <b>World</b></p>";
      expect(stripHtml(html)).toBe("Hello World");
    });

    it("should handle encoded entities correctly", () => {
      const html = "&lt;p&gt;Hello&lt;/p&gt;";
      expect(stripHtml(html)).toBe("Hello");
    });

    it("should not double unescape entities", () => {
      const html = "&amp;lt;";
      // If double unescaped: &amp;lt; -> &lt; -> < . If correct: &amp;lt; -> &lt;
      expect(stripHtml(html)).toBe("&lt;");
    });
  });

  describe("processRtfContent", () => {
    it("should strip HTML tags from non-RTF plain text content", async () => {
      const content = Buffer.from("Some text with <i>tags</i>.");
      const result = await processRtfContent(content);
      expect(result).toBe("Some text with tags .");
    });

    it("should return empty string for null content", async () => {
      const result = await processRtfContent(null);
      expect(result).toBe("");
    });

    it("should truncate content when maxLength is provided", async () => {
      const content = Buffer.from("A very long text content that should be truncated");
      const result = await processRtfContent(content, { maxLength: 10 });
      expect(result).toBe("A very lon");
    });

    it("should fallback to raw content and strip HTML when RTF parsing fails", async () => {
      const content = Buffer.from("{\\rtf1 malformed content with <b>tags</b>");
      // Mock rtfToHtml to throw error
      const { rtfToHtml } = await import("./rtf-encoding-handler");
      vi.mocked(rtfToHtml).mockRejectedValueOnce(new Error("Parsing failed"));

      const result = await processRtfContent(content);
      // It should return the raw content (decoded) but stripped of HTML tags
      expect(result).toBe("{\\rtf1 malformed content with tags");
    });
  });
});
