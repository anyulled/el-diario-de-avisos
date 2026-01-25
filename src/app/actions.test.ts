import { describe, it, expect, vi, afterEach } from 'vitest';
import { getNews } from './actions';
import { db } from '@/db';

// Mock setup
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('@/db/schema', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/db/schema')>();
  return {
    ...actual,
  };
});

vi.mock('@/lib/date-range', () => ({
  normalizeDateRange: () => ({ start: null, end: null, isValidRange: true }),
}));

vi.mock('@/lib/news-order', () => ({
  getNewsOrderBy: () => [],
}));

type MockResult = Record<string, unknown>[];

interface MockChain {
  from: () => MockChain;
  $dynamic: () => MockChain;
  where: () => MockChain;
  orderBy: () => MockChain;
  limit: () => MockChain;
  offset: () => MockChain;
  then: (resolve: (val: MockResult) => void, reject: (err: unknown) => void) => Promise<void>;
}

describe('getNews Performance', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should run queries in parallel', async () => {
    const stats = {
      activeQueries: 0,
      maxConcurrency: 0,
    };

    /**
     * A helper to simulate query execution delay and tracking
     */
    const executeQuery = async (result: MockResult) => {
      stats.activeQueries++;
      stats.maxConcurrency = Math.max(stats.maxConcurrency, stats.activeQueries);
      // 100ms delay
      await delay(100);
      stats.activeQueries--;
      return result;
    };

    /**
     * Chainable mock object factory
     */
    const createMockChain = (result: MockResult): MockChain => {
      const chain: Partial<MockChain> = {};

      const methods = ['from', '$dynamic', 'where', 'orderBy', 'limit', 'offset'] as const;
      methods.forEach((method) => {
        chain[method] = vi.fn().mockReturnValue(chain as MockChain);
      });

      chain.then = (resolve, reject) => {
        return executeQuery(result).then(resolve, reject);
      };

      return chain as MockChain;
    };

    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;

    mockSelect.mockImplementation((selection: { count?: unknown }) => {
       // If selection has 'count', return count result
       if (selection && selection.count) {
           return createMockChain([{ count: 10 }]);
       }
       // Otherwise return data result
       return createMockChain([]);
    });

    await getNews({});

    console.log(`Max concurrency: ${stats.maxConcurrency}`);
    expect(stats.maxConcurrency).toBe(2);
  });
});
