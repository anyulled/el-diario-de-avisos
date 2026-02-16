import { describe, it, expect, vi } from "vitest";
import { processRtfContent, stripHtml } from "./rtf-content-converter";

vi.mock("./rtf-encoding-handler", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
  decodeBuffer: vi.fn((buf: any) => buf.toString()),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  repairMojibake: vi.fn((str) => str),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  unescapeRtfHex: vi.fn((str) => str),
  rtfToHtml: vi.fn().mockResolvedValue("<html><body>test</body></html>"),
}));

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
      /*
       * If double unescaped: &amp;lt; -> &lt; -> <
       * If correct: &amp;lt; -> &lt;
       */
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
  });
});
