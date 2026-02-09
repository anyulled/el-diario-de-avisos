/* eslint-disable @eslint-community/eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ArticleCard } from "./article-card";
import { highlightText } from "@/lib/search-highlighter";
import { formatArticleTitle } from "@/lib/title-formatter";

// Mock dependencies
vi.mock("@/lib/search-highlighter", () => ({
  highlightText: vi.fn(),
}));

vi.mock("@/lib/title-formatter", () => ({
  formatArticleTitle: vi.fn((title) => `Formatted: ${title}`),
}));

describe("ArticleCard", () => {
  const mockItem = {
    id: 1,
    title: "Test Title",
    subtitle: "Test Subtitle",
    date: "2023-01-01",
    publicationYear: 2023,
    page: 5,
    publicationName: "Daily News",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly with full data and no search term", () => {
    vi.mocked(highlightText).mockImplementation((text) => text);

    render(<ArticleCard item={mockItem as any} searchTerm={null} />);

    // Check formatArticleTitle called
    expect(formatArticleTitle).toHaveBeenCalledWith("Test Title");

    // Title rendered (formatted)
    expect(screen.getByText("Formatted: Test Title")).toBeDefined();

    // Subtitle rendered
    expect(screen.getByText("Test Subtitle")).toBeDefined();

    // Date rendered
    expect(screen.getByText(/2023/)).toBeDefined();
    // Note: Date formatting depends on locale, "1 de enero de 2023" for es-VE

    // Publication Name
    expect(screen.getByText("Daily News")).toBeDefined();

    // Page
    expect(screen.getByText("Pág. 5")).toBeDefined();

    // Ref
    expect(screen.getByText("Ref: 1")).toBeDefined();

    // Link href
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/article/1");

    /*
     * HighlightText NOT called if no search term?
     * Wait, line 16: const highlightedTitle = searchTerm ? highlightText(...) : title;
     */
    expect(highlightText).not.toHaveBeenCalled();
  });

  it("renders and highlights text when search term provided", () => {
    vi.mocked(highlightText).mockReturnValue("<mark>Result</mark>");

    render(<ArticleCard item={mockItem as any} searchTerm="Result" />);

    expect(highlightText).toHaveBeenCalledWith("Formatted: Test Title", "Result");
    // Also called for subtitle
    expect(highlightText).toHaveBeenCalledWith("Test Subtitle", "Result");

    // Link href with search param
    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("/article/1?text=Result");
  });

  it("renders fallback for missing page", () => {
    const itemWithoutPage = { ...mockItem, page: null };

    render(<ArticleCard item={itemWithoutPage as any} searchTerm={null} />);

    expect(screen.getByText("—")).toBeDefined();
  });

  it("renders fallback for missing date (uses publicationYear)", () => {
    const itemWithoutDate = { ...mockItem, date: null, publicationYear: 2020 };

    render(<ArticleCard item={itemWithoutDate as any} searchTerm={null} />);

    expect(screen.getByText("2020")).toBeDefined();
  });
});
