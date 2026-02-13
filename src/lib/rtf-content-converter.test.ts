import { describe, it, expect, vi, afterEach } from "vitest";
import { processRtfContent, stripHtml } from "./rtf-content-converter";
import * as rtfEncodingHandler from "./rtf-encoding-handler";

describe("rtf-content-converter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("processRtfContent", () => {
    it("should process plain text content", async () => {
      const input = "Simple plain text";
      const result = await processRtfContent(input);
      expect(result).toBe("Simple plain text");
    });

    it("should handle null content", async () => {
      const result = await processRtfContent(null);
      expect(result).toBe("");
    });

    it("should handle errors by falling back to raw content and stripping HTML", async () => {
      // Mock rtfToHtml to throw an error
      vi.spyOn(rtfEncodingHandler, "rtfToHtml").mockRejectedValue(new Error("Mock Error"));

      const input = "{\\rtf1\\invalid... <b>Bold</b>}";
      // Expected: "Mock Error" triggers catch block.
      // Fallback is input string.
      // stripHtml(input) -> "{\\rtf1\\invalid... Bold }"
      // Note: stripHtml replaces tags with a space, so <b>Bold</b> becomes " Bold " (condensed to one space by whitespace replacement)
      const expected = "{\\rtf1\\invalid... Bold }";

      const result = await processRtfContent(input);
      expect(result).toBe(expected);
    });

    it("should respect maxLength option", async () => {
      const input = "Long text content";
      const result = await processRtfContent(input, { maxLength: 4 });
      expect(result).toBe("Long");
    });
  });

  describe("stripHtml", () => {
    it("should remove basic HTML tags", () => {
      const input = "<p>This is a paragraph.</p>";
      const expected = "This is a paragraph.";
      expect(stripHtml(input)).toBe(expected);
    });

    it("should remove <i> tags", () => {
      const input = "This is <i>italic</i> text.";
      const expected = "This is italic text.";
      expect(stripHtml(input)).toBe(expected);
    });

    it("should remove nested tags", () => {
      const input = "<div><p>Paragraph with <b>bold</b> text.</p></div>";
      const expected = "Paragraph with bold text.";
      expect(stripHtml(input)).toBe(expected);
    });

    it("should handle attributes in tags", () => {
      const input = '<a href="https://example.com">Link</a>';
      const expected = "Link";
      expect(stripHtml(input)).toBe(expected);
    });

    it("should handle multiline input", () => {
      const input = `
      <div>
        <p>Line 1</p>
        <p>Line 2</p>
      </div>
    `;
      const expected = "Line 1 Line 2";
      expect(stripHtml(input)).toBe(expected);
    });

    it("should handle the specific failing case from Cypress", () => {
      const input = "Esta noche a beneficio del profesor Del Valle, con <i>Catalina,</i> no lo olviden ustedes";
      const expected = "Esta noche a beneficio del profesor Del Valle, con Catalina, no lo olviden ustedes";
      expect(stripHtml(input)).toBe(expected);
    });

    it("should handle null or undefined input gracefully", () => {
      expect(stripHtml(null as unknown as string)).toBe("");
      expect(stripHtml(undefined as unknown as string)).toBe("");
      expect(stripHtml("")).toBe("");
    });
  });
});
