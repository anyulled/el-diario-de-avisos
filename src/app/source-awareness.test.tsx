import { ArticleSwiper } from "@/components/article-swiper";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ArticleCard } from "../components/article-card";


vi.mock("next/link", () => {
    return {
        default: ({ children }: { children: React.ReactNode }) => children,
    };
});

vi.mock("swiper/react", () => ({
    Swiper: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SwiperSlide: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("swiper/modules", () => ({
    Navigation: {},
    Pagination: {},
    Autoplay: {},
    Parallax: {},
}));

vi.mock("swiper/css", () => ({}));
vi.mock("swiper/css/navigation", () => ({}));
vi.mock("swiper/css/pagination", () => ({}));

describe("Source Awareness UI", () => {
    afterEach(() => {
        cleanup();
    });

    describe("ArticleCard", () => {
        it("should render publication name when provided", () => {
            const mockItem = {
                id: 1,
                title: "Test Article",
                subtitle: "Test Subtitle",
                date: "2023-10-27",
                publicationYear: 2023,
                page: "5",
                publicationName: "El Diario de Avisos",
            };

            render(<ArticleCard item={mockItem} searchTerm={null} />);

            expect(screen.getByText("El Diario de Avisos")).toBeDefined();
        });

        it("should render publication name 'La Opinión Nacional'", () => {
            const mockItem = {
                id: 2,
                title: "Another Article",
                subtitle: "Subtitle",
                date: "1885-01-01",
                publicationYear: 1885,
                page: "3",
                publicationName: "La Opinión Nacional",
            };

            render(<ArticleCard item={mockItem} searchTerm={null} />);

            expect(screen.getByText("La Opinión Nacional")).toBeDefined();
        });

        it("should not render publication name if not provided", () => {
            const mockItem = {
                id: 3,
                title: "Legacy Article",
                subtitle: null,
                date: null,
                publicationYear: 1880,
                page: "1",
                publicationName: null,
            };

            render(<ArticleCard item={mockItem} searchTerm={null} />);

            const pubName = screen.queryByText("El Diario de Avisos");
            expect(pubName).toBeNull();
        });
    });

    describe("ArticleSwiper", () => {
        it("should render publication name in slides", () => {
            const mockArticles = [
                {
                    id: 1,
                    title: "Swiper Article",
                    subtitle: "Swiper Subtitle",
                    date: "1885-05-20",
                    publicationYear: 1885,
                    page: "1",
                    extract: "Snippet...",
                    publicationName: "La Opinión Nacional",
                },
            ];

            render(<ArticleSwiper articles={mockArticles as never} />);

            expect(screen.getByText("La Opinión Nacional")).toBeDefined();
        });
    });
});
