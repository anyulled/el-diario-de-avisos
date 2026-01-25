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

// Mock schema to avoid actual db dependencies
vi.mock('@/db/schema', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/db/schema')>();
  return {
    ...actual,
  };
});

// Mock other dependencies that might be used
vi.mock('@/lib/date-range', () => ({
  normalizeDateRange: () => ({ start: null, end: null, isValidRange: true }),
}));

vi.mock('@/lib/news-order', () => ({
  getNewsOrderBy: () => [],
}));

describe('getNews Performance', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should run queries in parallel', async () => {
    let activeQueries = 0;
    let maxConcurrency = 0;

    // A helper to simulate query execution delay and tracking
    const executeQuery = async (result: any) => {
      activeQueries++;
      maxConcurrency = Math.max(maxConcurrency, activeQueries);
      await delay(100); // 100ms delay
      activeQueries--;
      return result;
    };

    // Chainable mock object factory
    const createMockChain = (result: any) => {
      const chain: any = {};

      const methods = ['from', '$dynamic', 'where', 'orderBy', 'limit', 'offset'];
      methods.forEach(method => {
        chain[method] = vi.fn().mockReturnValue(chain);
      });

      // The 'then' method makes it awaitable
      chain.then = (resolve: any, reject: any) => {
        return executeQuery(result).then(resolve, reject);
      };

      return chain;
    };

    // Cast db to any to access the mock
    (db.select as any).mockImplementation((selection: any) => {
       // If selection has 'count', return count result
       if (selection && selection.count) {
           return createMockChain([{ count: 10 }]);
       }
       // Otherwise return data result
       return createMockChain([]);
    });

    await getNews({});

    console.log(`Max concurrency: ${maxConcurrency}`);
    expect(maxConcurrency).toBe(2);
  });
});
