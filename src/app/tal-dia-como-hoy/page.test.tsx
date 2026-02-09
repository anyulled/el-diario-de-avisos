import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import OnThisDayPage, { metadata } from "./page";
import * as actions from "@/actions/actions";

// Mock child components
vi.mock("@/components/navbar", () => ({
  Navbar: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("@/components/hero", () => ({
  Hero: ({ title, subtitle, badge }: { title: string; subtitle: string; badge: string }) => (
    <div data-testid="hero">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <span>{badge}</span>
    </div>
  ),
}));

vi.mock("@/components/article-swiper", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ArticleSwiper: ({ articles }: { articles: any[] }) => <div data-testid="article-swiper">Swiper with {articles.length} articles</div>,
}));

// Mock actions
vi.mock("@/actions/actions", () => ({
  getArticlesOnThisDay: vi.fn(),
}));

// Mock Luxon to have consistent date
vi.mock("luxon", () => {
  return {
    DateTime: {
      now: () => ({
        setZone: () => ({
          day: 15,
          month: 8,
          setLocale: () => ({
            toLocaleString: () => "15 de agosto",
          }),
        }),
      }),
    },
  };
});

describe("OnThisDayPage", () => {
  it("renders page with articles correctly", async () => {
    const mockArticles = [
      { id: 1, title: "Article 1" },
      { id: 2, title: "Article 2" },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(actions.getArticlesOnThisDay).mockResolvedValue(mockArticles as any);

    render(await OnThisDayPage());

    expect(screen.getByTestId("navbar")).toBeDefined();
    expect(screen.getByTestId("hero")).toBeDefined();
    // Check Hero content
    expect(screen.getByText("Tal día como hoy")).toBeDefined();
    expect(screen.getByText(/Artículos musicales publicados el 15 de agosto/)).toBeDefined();
    expect(screen.getByText("Efemérides")).toBeDefined();

    // Check Swiper
    expect(screen.getByTestId("article-swiper")).toBeDefined();
    expect(screen.getByText("Swiper with 2 articles")).toBeDefined();

    // Check Divider Title
    expect(screen.getByText("Artículos del 15 de agosto")).toBeDefined();

    // Ensure empty state is NOT present
    expect(screen.queryByText(/No se encontraron artículos/)).toBeNull();
  });

  it("renders empty state when no articles found", async () => {
    vi.mocked(actions.getArticlesOnThisDay).mockResolvedValue([]);

    render(await OnThisDayPage());

    expect(screen.getByTestId("hero")).toBeDefined();

    // Check empty state message
    expect(screen.getByText("No se encontraron artículos para esta fecha.")).toBeDefined();
    expect(screen.getByText(/Intenta visitar la sección de búsqueda/)).toBeDefined();

    // Ensure swiper is NOT present
    expect(screen.queryByTestId("article-swiper")).toBeNull();
  });

  it("renders empty state when articles is null/undefined", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(actions.getArticlesOnThisDay).mockResolvedValue(null as any);

    render(await OnThisDayPage());

    expect(screen.getByText("No se encontraron artículos para esta fecha.")).toBeDefined();
    expect(screen.queryByTestId("article-swiper")).toBeNull();
  });

  it("has correct metadata", () => {
    expect(metadata.title).toContain("Tal día como hoy");
    expect(metadata.description).toBeDefined();
  });
});
