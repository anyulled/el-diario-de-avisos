import { describe, expect, it, vi } from "vitest";
import { processRtfContent, stripHtml } from "./rtf-content-converter";

// Mock @iarna/rtf-to-html
vi.mock("@iarna/rtf-to-html", () => ({
  fromString: (rtf: string, options: unknown, cb: (err: Error | null, html: string) => void) => {
    const callback = (typeof options === "function" ? options : cb) as (err: Error | null, html: string) => void;
    if (rtf.includes("ERROR_PLEASE")) {
      callback(new Error("Mock Error"), "");
    } else if (rtf.includes("Hello World")) {
      callback(null, "<div>Hello World</div>");
    } else {
      callback(null, rtf);
    }
  },
}));

describe("rtf-content-converter", () => {
  describe("stripHtml", () => {
    it("should remove HTML tags and normalize whitespace", () => {
      expect(stripHtml("<p>Hello <b>World</b></p>")).toBe("Hello World");
      expect(stripHtml("Multiple    spaces")).toBe("Multiple spaces");
    });
  });

  describe("processRtfContent", () => {
    it("should return empty string if content is null", async () => {
      const result = await processRtfContent(null);
      expect(result).toBe("");
    });

    it("should handle plain text while preserving paragraphs", async () => {
      const content = "Paragraph 1\n\nParagraph 2";
      const result = await processRtfContent(content);
      expect(result).toBe("Paragraph 1\n\nParagraph 2");
    });

    it("should handle plain text without preserving paragraphs", async () => {
      const content = "Paragraph 1\n\nParagraph 2";
      const result = await processRtfContent(content, { preserveParagraphs: false });
      expect(result).toBe("Paragraph 1 Paragraph 2");
    });

    it("should detect and process RTF content", async () => {
      const content = "{\\rtf1 Hello World}";
      const result = await processRtfContent(content);
      expect(result).toBe("Hello World");
    });

    it("should truncate output if maxLength is provided", async () => {
      const result = await processRtfContent("Hello World", { maxLength: 5 });
      expect(result).toBe("Hello");
    });

    it("should handle errors by falling back to raw content", async () => {
      const content = "{\\rtf1 ERROR_PLEASE}";
      const result = await processRtfContent(content);
      expect(result).toContain("ERROR_PLEASE");
    });
  });
});
