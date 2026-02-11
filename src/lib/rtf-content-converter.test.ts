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

    it("should return empty string for null/undefined content", async () => {
      expect(await processRtfContent(null)).toBe("");
    });

    it("should handle plain text with preserveParagraphs: false", async () => {
      const text = "Para 1\n\nPara 2";
      expect(await processRtfContent(text, { preserveParagraphs: false })).toBe("Para 1 Para 2");
    });

    it("should handle errors by falling back to raw content", async () => {
      const content = "{\\rtf1 ERROR_PLEASE}";
      const result = await processRtfContent(content);
      expect(result).toContain("ERROR_PLEASE");
    });

    it("should correctly decode UTF-8 content", async () => {
      // UTF-8 representation of 'ñ' is 0xC3 0xB1
      const content = Buffer.from([0xc3, 0xb1]);
      const result = await processRtfContent(content);
      expect(result).toBe("ñ");
    });

    it("should fallback to Win1252 for invalid UTF-8 content", async () => {
      /**
       * Win1252 representation of 'ñ' is 0xF1
       * In UTF-8, 0xF1 is a start byte that requires continuation, so it's invalid standalone.
       */
      const content = Buffer.from([0xf1]);
      const result = await processRtfContent(content);
      expect(result).toBe("ñ");
    });

    it("should repair Mojibake (UTF-8 bytes interpreted as Latin1)", async () => {
      // "AÃ±o" is what you get if you read UTF-8 bytes for "Año" (41 C3 B1 6F) via Latin1
      const content = "AÃ±o";
      const result = await processRtfContent(content);
      expect(result).toBe("Año");
    });
  });

  it("processRtfContent should return empty string for null content", async () => {
    const { processRtfContent } = await import("./rtf-content-converter");
    const result = await processRtfContent(null);
    expect(result).toBe("");
  });
});
