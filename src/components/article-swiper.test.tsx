/* eslint-disable @eslint-community/eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment */
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArticleSwiper } from "./article-swiper";

// Hoist mocks
const { slidePrev, slideNext } = vi.hoisted(() => ({
  slidePrev: vi.fn(),
  slideNext: vi.fn(),
}));

vi.mock("swiper/react", async () => {
  const React = await import("react");
  const { useEffect } = React;

  return {
    Swiper: ({ children, onSwiper, onSlideChange }: { children: React.ReactNode; onSwiper?: (s: any) => void; onSlideChange?: (s: any) => void }) => {
      useEffect(() => {
        if (onSwiper) {
          onSwiper({
            isBeginning: true,
            isEnd: false,
            slidePrev: slidePrev,
            slideNext: slideNext,
            on: vi.fn(),
            off: vi.fn(),
            destroyed: false,
          });
        }
      }, []);

      return (
        <div data-testid="swiper">
          {children}
          {}
          <button data-testid="simulate-slide-change" onClick={() => onSlideChange?.({ isBeginning: false, isEnd: true })}>
            Simulate Change
          </button>
        </div>
      );
    },

    SwiperSlide: ({ children }: any) => <div data-testid="swiper-slide">{children}</div>,
  };
});

vi.mock("swiper/modules", () => ({
  Autoplay: () => null,
  Navigation: () => null,
  Pagination: () => null,
  Parallax: () => null,
}));

vi.mock("swiper/css", () => ({}));
vi.mock("swiper/css/navigation", () => ({}));
vi.mock("swiper/css/pagination", () => ({}));

describe("ArticleSwiper", () => {
  const mockArticles = [
    {
      id: 1,
      title: "Article 1",
      subtitle: "Subtitle 1",
      content: "Content",
      extract: "Extract 1",
      date: "2023-01-01",
      publicationYear: 2023,
      publicationName: "Daily News",
    },
    {
      id: 2,
      title: "Article 2",
      subtitle: "Subtitle 2",
      content: "Content",
      extract: "Extract 2",
      date: "2023-01-02",
      publicationYear: 2023,
      publicationName: null,
    },
  ];

  it("renders slides correctly", () => {
    render(<ArticleSwiper articles={mockArticles as any} />);

    expect(screen.getAllByTestId("swiper-slide")).toHaveLength(2);
    expect(screen.getByText("Article 1")).toBeDefined();
    expect(screen.getByText("Extract 1")).toBeDefined();
    expect(screen.getByText("Daily News")).toBeDefined();

    expect(screen.getByText("Article 2")).toBeDefined();
  });

  it("handles navigation buttons", async () => {
    render(<ArticleSwiper articles={mockArticles as any} />);

    const prevBtn = screen.getByLabelText("Previous slide");
    const nextBtn = screen.getByLabelText("Next slide");

    // Initially prev is disabled (isBeginning=true from mock)
    expect(prevBtn.hasAttribute("disabled")).toBe(true);
    expect(nextBtn.hasAttribute("disabled")).toBe(false);

    // Click next
    fireEvent.click(nextBtn);
    expect(slideNext).toHaveBeenCalled();

    // Simulate slide change to end
    fireEvent.click(screen.getByTestId("simulate-slide-change"));

    await waitFor(() => {
      // IsEnd=true
      expect(nextBtn.hasAttribute("disabled")).toBe(true);
      // IsBeginning=false
      expect(prevBtn.hasAttribute("disabled")).toBe(false);
    });

    // Click prev
    fireEvent.click(prevBtn);
    expect(slidePrev).toHaveBeenCalled();
  });

  it("renders correct year fallback", () => {
    const articleWithNoDate = [
      {
        ...mockArticles[0],
        date: null,
        publicationYear: 1999,
      },
    ];

    render(<ArticleSwiper articles={articleWithNoDate as any} />);
    expect(screen.getByText("1999")).toBeDefined();
  });
});
