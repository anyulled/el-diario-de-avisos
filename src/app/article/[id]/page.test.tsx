/* eslint-disable @eslint-community/eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
import { render, screen } from "@testing-library/react";
import { notFound } from "next/navigation";
import { describe, expect, it, vi, beforeEach } from "vitest";
import ArticlePage, { generateMetadata } from "./page";
import * as actions from "@/actions/actions";
import * as highlighter from "@/lib/search-highlighter";

// Mock dependencies
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/components/navbar", () => ({
  Navbar: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("@/actions/actions", () => ({
  getArticleMetadata: vi.fn(),
  getArticleHtml: vi.fn(),
  getArticleSection: vi.fn(),
}));

vi.mock("@/lib/search-highlighter", () => ({
  highlightText: vi.fn(),
}));

vi.mock("@/lib/title-formatter", () => ({
  formatArticleTitle: vi.fn((title) => `Formatted: ${title}`),
}));

describe("ArticlePage", () => {
  const mockArticle = {
    id: 123,
    title: "Test Article",
    subtitle: "Test Subtitle",
    publicationYear: 2023,
    page: 5,
    date: "2023-01-01",
    columnId: 1,
    publicationName: "Diario Test",
  };
  const mockHtml = "<p>Processed Content</p>";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateMetadata", () => {
    it("returns metadata for existing article", async () => {
      vi.mocked(actions.getArticleMetadata).mockResolvedValue(mockArticle as any);

      const params = Promise.resolve({ id: "123" }) as any;
      const metadata = await generateMetadata({ params });

      expect(actions.getArticleMetadata).toHaveBeenCalledWith(123);
      expect(metadata).toEqual({
        title: "Formatted: Test Article",
        description: "Test Subtitle",
        openGraph: {
          title: "Formatted: Test Article",
          description: "Test Subtitle",
          type: "article",
          publishedTime: "2023-01-01",
        },
      });
    });

    it("returns metadata with fallback description if subtitle is missing", async () => {
      vi.mocked(actions.getArticleMetadata).mockResolvedValue({
        ...mockArticle,
        subtitle: null,
      } as any);

      const params = Promise.resolve({ id: "123" }) as any;
      const metadata = await generateMetadata({ params });

      expect(metadata.description).toBe("Año 2023 - Página 5");
    });

    it("returns empty object if article not found", async () => {
      vi.mocked(actions.getArticleMetadata).mockResolvedValue(null as any);

      const params = Promise.resolve({ id: "999" }) as any;
      const metadata = await generateMetadata({ params });

      expect(metadata).toEqual({});
    });
  });

  describe("ArticleComponent", () => {
    it("renders article content correctly", async () => {
      vi.mocked(actions.getArticleMetadata).mockResolvedValue(mockArticle as any);
      vi.mocked(actions.getArticleHtml).mockResolvedValue(mockHtml);
      vi.mocked(actions.getArticleSection).mockResolvedValue({ name: "Music" } as any);

      const params = Promise.resolve({ id: "123" }) as any;
      const searchParams = Promise.resolve({}) as any;

      const ui = await ArticlePage({ params, searchParams });
      render(ui);

      expect(screen.getByTestId("navbar")).toBeDefined();
      expect(screen.getByText("Formatted: Test Article")).toBeDefined();
      // Section name
      expect(screen.getByText("Music")).toBeDefined();
      // Publication name
      expect(screen.getByText("Diario Test")).toBeDefined();
      // Check content rendered via dangerouslySetInnerHTML
      expect(screen.getByText("Processed Content")).toBeDefined();

      // Check footer info
      expect(screen.getByText("Página: 5")).toBeDefined();
      expect(screen.getByText("Ref: 123")).toBeDefined();
    });

    it("calls notFound if article does not exist", async () => {
      vi.mocked(actions.getArticleMetadata).mockResolvedValue(null as any);
      vi.mocked(actions.getArticleHtml).mockResolvedValue("");

      const params = Promise.resolve({ id: "999" }) as any;
      const searchParams = Promise.resolve({}) as any;

      try {
        await ArticlePage({ params, searchParams });
      } catch {
        // Not found throws in real Next.js, but our mock just calls the fn
      }

      expect(notFound).toHaveBeenCalled();
    });

    it("highlights text if search term provided", async () => {
      vi.mocked(actions.getArticleMetadata).mockResolvedValue(mockArticle as any);
      vi.mocked(actions.getArticleHtml).mockResolvedValue("<p>Content with Term</p>");
      vi.mocked(highlighter.highlightText).mockReturnValue("<p>Content with <mark>Term</mark></p>");

      const params = Promise.resolve({ id: "123" }) as any;
      const searchParams = Promise.resolve({ text: "Term" }) as any;

      const ui = await ArticlePage({ params, searchParams });
      render(ui);

      expect(highlighter.highlightText).toHaveBeenCalledWith("<p>Content with Term</p>", "Term");
    });

    it("renders default section name if none found", async () => {
      vi.mocked(actions.getArticleMetadata).mockResolvedValue({ ...mockArticle, columnId: null } as any);
      vi.mocked(actions.getArticleHtml).mockResolvedValue(mockHtml);

      const params = Promise.resolve({ id: "123" }) as any;
      const searchParams = Promise.resolve({}) as any;

      const ui = await ArticlePage({ params, searchParams });
      render(ui);

      expect(screen.getByText("Noticia")).toBeDefined();
    });

    it("renders year only if date is missing", async () => {
      vi.mocked(actions.getArticleMetadata).mockResolvedValue({ ...mockArticle, date: null } as any);
      vi.mocked(actions.getArticleHtml).mockResolvedValue(mockHtml);

      const params = Promise.resolve({ id: "123" }) as any;
      const searchParams = Promise.resolve({}) as any;

      const ui = await ArticlePage({ params, searchParams });
      render(ui);

      expect(screen.getByText("Año 2023")).toBeDefined();
    });
  });
});
