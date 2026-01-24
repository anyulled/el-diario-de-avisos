import { describe, expect, it } from "vitest";
import { extractPageReference, normalizePageReference } from "./page-extractor";

describe("extractPageReference", () => {
  describe("single page patterns", () => {
    it("should extract single page with lowercase p and period", () => {
      const content = Buffer.from("Some text (p.4) more text");
      const result = extractPageReference(content);
      expect(result.pages).toBe("4");
      expect(result.matched).toBe(true);
      expect(result.pattern).toBe("single");
    });

    it("should extract single page with uppercase P and period", () => {
      const content = Buffer.from("Some text (P.3) more text");
      const result = extractPageReference(content);
      expect(result.pages).toBe("3");
      expect(result.matched).toBe(true);
    });

    it("should extract single page with space after period", () => {
      const content = Buffer.from("Some text (P. 5) more text");
      const result = extractPageReference(content);
      expect(result.pages).toBe("5");
      expect(result.matched).toBe(true);
    });

    it("should extract single page without period", () => {
      const content = Buffer.from("Some text (p 7) more text");
      const result = extractPageReference(content);
      expect(result.pages).toBe("7");
      expect(result.matched).toBe(true);
    });
  });

  describe("page range patterns with 'y'", () => {
    it("should extract page range with lowercase p and y", () => {
      const content = Buffer.from("Some text (p.3 y 4) more text");
      const result = extractPageReference(content);
      expect(result.pages).toBe("3-4");
      expect(result.matched).toBe(true);
      expect(result.pattern).toBe("range_y");
    });

    it("should extract page range with uppercase P and y", () => {
      const content = Buffer.from("Some text (P. 3 y 4) more text");
      const result = extractPageReference(content);
      expect(result.pages).toBe("3-4");
      expect(result.matched).toBe(true);
    });

    it("should extract page range with extra spaces", () => {
      const content = Buffer.from("Some text (P.  5  y  6) more text");
      const result = extractPageReference(content);
      expect(result.pages).toBe("5-6");
      expect(result.matched).toBe(true);
    });
  });

  describe("page range patterns with '&'", () => {
    it("should extract page range with ampersand", () => {
      const content = Buffer.from("Some text (p.3 & 4) more text");
      const result = extractPageReference(content);
      expect(result.pages).toBe("3-4");
      expect(result.matched).toBe(true);
      expect(result.pattern).toBe("range_ampersand");
    });

    it("should extract page range with uppercase P and ampersand", () => {
      const content = Buffer.from("Some text (P. 2 & 3) more text");
      const result = extractPageReference(content);
      expect(result.pages).toBe("2-3");
      expect(result.matched).toBe(true);
    });
  });

  describe("multiple page patterns", () => {
    it("should extract multiple pages with commas and y", () => {
      const content = Buffer.from("Some text (P. 3, 4 y 5) more text");
      const result = extractPageReference(content);
      expect(result.pages).toBe("3, 4, 5");
      expect(result.matched).toBe(true);
      expect(result.pattern).toBe("multiple_y");
    });

    it("should extract multiple pages with more than three pages", () => {
      const content = Buffer.from("Some text (p. 2, 3, 4 y 5) more text");
      const result = extractPageReference(content);
      expect(result.pages).toBe("2, 3, 4, 5");
      expect(result.matched).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should return null for null content", () => {
      const result = extractPageReference(null);
      expect(result.pages).toBeNull();
      expect(result.matched).toBe(false);
    });

    it("should return null for content without page reference", () => {
      const content = Buffer.from("Some text without page reference");
      const result = extractPageReference(content);
      expect(result.pages).toBeNull();
      expect(result.matched).toBe(false);
    });

    it("should handle string content", () => {
      const content = "Some text (p.4) more text";
      const result = extractPageReference(content);
      expect(result.pages).toBe("4");
      expect(result.matched).toBe(true);
    });

    it("should extract first match when multiple patterns exist", () => {
      const content = Buffer.from("Text (p.3 y 4) and (p.5) more text");
      const result = extractPageReference(content);
      expect(result.pages).toBe("3-4");
      expect(result.matched).toBe(true);
    });
  });
});

describe("normalizePageReference", () => {
  it("should return the page reference as-is for valid input", () => {
    expect(normalizePageReference("4")).toBe("4");
    expect(normalizePageReference("3-4")).toBe("3-4");
    expect(normalizePageReference("3, 4, 5")).toBe("3, 4, 5");
  });

  it("should return 'No especificada' for null input", () => {
    expect(normalizePageReference(null)).toBe("No especificada");
  });

  it("should return 'No especificada' for empty string", () => {
    expect(normalizePageReference("")).toBe("No especificada");
  });
});
