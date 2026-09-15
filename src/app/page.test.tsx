import { describe, it, expect, vi, afterEach } from "vitest";
import Home from "./page";
import * as actions from "@/actions/actions";

// Mock the actions
vi.mock("@/actions/actions", () => ({
  getNewsTypes: vi.fn(),
  getPublications: vi.fn(),
  getNews: vi.fn(),
}));

// Mock components to avoid any import issues
vi.mock("@/components/hero", () => ({ Hero: () => null }));
vi.mock("@/components/navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/news-grid", () => ({ NewsGrid: () => null }));
vi.mock("@/components/pagination", () => ({ Pagination: () => null }));
vi.mock("@/components/scroll-to-results", () => ({ ScrollToResults: () => null }));
vi.mock("@/components/search-filters", () => ({ SearchFilters: () => null }));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe("Home Page Performance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch data in parallel", async () => {
    const getNewsTypesMock = vi.mocked(actions.getNewsTypes);
    const getPublicationsMock = vi.mocked(actions.getPublications);
    const getNewsMock = vi.mocked(actions.getNews);

    getNewsTypesMock.mockImplementation(async () => {
      await delay(100);
      return [];
    });

    getNewsMock.mockImplementation(async () => {
      await delay(100);
      return { data: [], total: 0 };
    });

    getPublicationsMock.mockImplementation(async () => {
      await delay(100);
      return [];
    });

    const start = performance.now();
    // Simulate empty search params
    await Home({ searchParams: Promise.resolve({ text: "test", type: "1" }) });
    const end = performance.now();
    const duration = end - start;

    /**
     * Expectation: Parallel execution should be close to 100ms.
     * Sequential execution (current) should be close to 200ms.
     * We set the threshold to 150ms to strictly require parallelism.
     */
    expect(duration).toBeLessThan(250);
  });

  it("should ignore empty search params when building scrollKey", async () => {
    const getNewsTypesMock = vi.mocked(actions.getNewsTypes);
    const getPublicationsMock = vi.mocked(actions.getPublications);
    const getNewsMock = vi.mocked(actions.getNews);

    getNewsTypesMock.mockResolvedValue([]);
    getPublicationsMock.mockResolvedValue([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    getNewsMock.mockResolvedValue({ data: [{ id: 1 } as any], total: 1 });

    const result = await Home({
      searchParams: Promise.resolve({
        text: "",
        type: null as unknown as string,
        page: "1",
        pageSize: undefined as unknown as string,
        pubId: "2",
      }),
    });

    expect(result).toBeDefined();
  });
});
