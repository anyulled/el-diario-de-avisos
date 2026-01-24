import { describe, expect, it } from "vitest";
import { formatArticleTitle } from "./title-formatter";

describe("formatArticleTitle", () => {
  describe("pattern matching", () => {
    it("should extract article number from standard pattern", () => {
      const title = "(Sin Título) DIARIO DE AVISOS 1878.rtf, Articulo #2548";
      expect(formatArticleTitle(title)).toBe("Artículo #2548");
    });

    it("should handle different years", () => {
      const title = "(Sin Título) DIARIO DE AVISOS 1920.rtf, Articulo #5000";
      expect(formatArticleTitle(title)).toBe("Artículo #5000");
    });

    it("should handle different article numbers", () => {
      const title = "(Sin Título) DIARIO DE AVISOS 1878.rtf, Articulo #2558";
      expect(formatArticleTitle(title)).toBe("Artículo #2558");
    });

    it("should handle case-insensitive matching for 'Sin Título'", () => {
      const title = "(sin título) DIARIO DE AVISOS 1878.rtf, Articulo #2594";
      expect(formatArticleTitle(title)).toBe("Artículo #2594");
    });

    it("should handle case-insensitive matching for 'Articulo'", () => {
      const title = "(Sin Título) DIARIO DE AVISOS 1878.rtf, articulo #2600";
      expect(formatArticleTitle(title)).toBe("Artículo #2600");
    });

    it("should handle mixed case", () => {
      const title = "(SIN TÍTULO) DIARIO DE AVISOS 1878.rtf, ARTICULO #1234";
      expect(formatArticleTitle(title)).toBe("Artículo #1234");
    });

    it("should handle extra whitespace", () => {
      const title = "(Sin Título)  DIARIO DE AVISOS 1878.rtf,  Articulo #9999";
      expect(formatArticleTitle(title)).toBe("Artículo #9999");
    });
  });

  describe("non-matching titles", () => {
    it("should return normal titles unchanged", () => {
      const title = "La Guerra de Independencia";
      expect(formatArticleTitle(title)).toBe("La Guerra de Independencia");
    });

    it("should return titles with 'Sin Título' in different context unchanged", () => {
      const title = "Sin Título de Nobleza";
      expect(formatArticleTitle(title)).toBe("Sin Título de Nobleza");
    });

    it("should return titles without article number unchanged", () => {
      const title = "(Sin Título) DIARIO DE AVISOS 1878.rtf";
      expect(formatArticleTitle(title)).toBe("(Sin Título) DIARIO DE AVISOS 1878.rtf");
    });

    it("should return titles with partial pattern unchanged", () => {
      const title = "DIARIO DE AVISOS 1878.rtf, Articulo #2548";
      expect(formatArticleTitle(title)).toBe("DIARIO DE AVISOS 1878.rtf, Articulo #2548");
    });
  });

  describe("edge cases", () => {
    it("should handle null title", () => {
      expect(formatArticleTitle(null)).toBe("Sin Título");
    });

    it("should handle undefined title", () => {
      expect(formatArticleTitle(undefined)).toBe("Sin Título");
    });

    it("should handle empty string", () => {
      expect(formatArticleTitle("")).toBe("Sin Título");
    });

    it("should handle whitespace-only string", () => {
      expect(formatArticleTitle("   ")).toBe("Sin Título");
    });

    it("should handle very large article numbers", () => {
      const title = "(Sin Título) DIARIO DE AVISOS 1878.rtf, Articulo #999999";
      expect(formatArticleTitle(title)).toBe("Artículo #999999");
    });

    it("should handle single-digit article numbers", () => {
      const title = "(Sin Título) DIARIO DE AVISOS 1878.rtf, Articulo #1";
      expect(formatArticleTitle(title)).toBe("Artículo #1");
    });
  });

  describe("special characters and variations", () => {
    it("should handle titles with accented characters", () => {
      const title = "Crónica de la Ciudad";
      expect(formatArticleTitle(title)).toBe("Crónica de la Ciudad");
    });

    it("should handle titles with special punctuation", () => {
      const title = "¿Qué pasó en 1878?";
      expect(formatArticleTitle(title)).toBe("¿Qué pasó en 1878?");
    });

    it("should not match if article number is missing the hash", () => {
      const title = "(Sin Título) DIARIO DE AVISOS 1878.rtf, Articulo 2548";
      expect(formatArticleTitle(title)).toBe("(Sin Título) DIARIO DE AVISOS 1878.rtf, Articulo 2548");
    });
  });
});
