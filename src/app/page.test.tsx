import { describe, it, expect, vi, afterEach } from 'vitest';
import Home from './page';
import * as actions from './actions';

// Mock the actions
vi.mock('./actions', () => ({
  getNewsTypes: vi.fn(),
  getNews: vi.fn(),
}));

// Mock components to avoid any import issues
vi.mock('@/components/hero', () => ({ Hero: () => null }));
vi.mock('@/components/navbar', () => ({ Navbar: () => null }));
vi.mock('@/components/news-grid', () => ({ NewsGrid: () => null }));
vi.mock('@/components/pagination', () => ({ Pagination: () => null }));
vi.mock('@/components/scroll-to-results', () => ({ ScrollToResults: () => null }));
vi.mock('@/components/search-filters', () => ({ SearchFilters: () => null }));

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Home Page Performance', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch data in parallel', async () => {
    const getNewsTypesMock = vi.mocked(actions.getNewsTypes);
    const getNewsMock = vi.mocked(actions.getNews);

    getNewsTypesMock.mockImplementation(async () => {
      await delay(100);
      return [];
    });

    getNewsMock.mockImplementation(async () => {
      await delay(100);
      return { data: [], total: 0 };
    });

    const start = performance.now();
    // Simulate empty search params
    await Home({ searchParams: Promise.resolve({}) });
    const end = performance.now();
    const duration = end - start;

    console.log(`Duration: ${duration}ms`);

    // Expectation: Parallel execution should be close to 100ms.
    // Sequential execution (current) should be close to 200ms.
    // We set the threshold to 150ms to strictly require parallelism.
    expect(duration).toBeLessThan(150);
  });
});
