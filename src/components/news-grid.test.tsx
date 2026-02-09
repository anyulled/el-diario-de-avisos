/* eslint-disable @eslint-community/eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NewsGrid } from "./news-grid";

// Mock ArticleCard to isolate NewsGrid testing
vi.mock("./article-card", () => ({
  ArticleCard: ({ item }: { item: { title: string } }) => <div data-testid="article-card">{item.title}</div>,
}));

describe("NewsGrid", () => {
  const mockNews = [
    {
      id: 1,
      title: "Article 1",
      subtitle: "Subtitle 1",
      date: "2023-01-01",
      publicationYear: 2023,
      page: 1,
      publicationName: "Daily News",
    },
    {
      id: 2,
      title: "Article 2",
      subtitle: "Subtitle 2",
      date: "2023-01-02",
      publicationYear: 2023,
      page: 2,
      publicationName: "Daily News",
    },
  ];

  it("renders list of articles when news is provided", () => {
    render(<NewsGrid news={mockNews as any} searchTerm="test" />);

    expect(screen.getAllByTestId("article-card")).toHaveLength(2);
    expect(screen.getByText("Article 1")).toBeDefined();
    expect(screen.getByText("Article 2")).toBeDefined();
  });

  it("renders empty state message when news provided is empty array", () => {
    render(<NewsGrid news={[]} searchTerm="test" />);

    expect(screen.getByText("No se encontraron resultados para su búsqueda.")).toBeDefined();
    expect(screen.queryByTestId("article-card")).toBeNull();
  });
});
