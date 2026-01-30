import { describe, it, expect, vi, afterEach } from 'vitest';
import { getArticleById } from './actions';
import { db } from '@/db';

// Mock setup
vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unstable_cache: (fn: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return fn;
  },
}));

interface MockChain {
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  then: (resolve: (value: unknown) => void) => Promise<void>;
  catch: ReturnType<typeof vi.fn>;
  finally: ReturnType<typeof vi.fn>;
  [key: string]: unknown;
}

// Mock chain
const createMockChain = (): MockChain => {
  const chain: Partial<MockChain> = {};
  const methods = ['from', 'where', 'limit', 'catch', 'finally'];
  methods.forEach((method) => {
    chain[method] = vi.fn().mockReturnValue(chain);
  });
  // Mocking then to resolve
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain.then = (resolve: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    resolve([{ id: 1, title: 'Test Article' }]);
    return Promise.resolve();
  };
  return chain as MockChain;
};

describe('getArticleById Performance', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should exclude searchVector from the query', async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain());

    await getArticleById(1);

    /**
     * Capture the arguments passed to db.select
     * Currently, it is called with no arguments (undefined)
     * We expect it to be called with an object representing the columns
     */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const callArgs = mockSelect.mock.calls[0][0];

    // This expectation should FAIL before optimization
    expect(callArgs).toBeDefined();

    /**
     * Once defined, check that searchVector is NOT in the selected columns
     * We can't easily check for the property key 'searchVector' because
     * Drizzle column objects are complex.
     * But if we pass a plain object to select, keys might be preserved?
     * Drizzle uses the column object itself as the key/value usually.
     * If we use getTableColumns(articles), we pass an object { colName: ColumnObj, ... }
     */
    // Let's assume callArgs is an object.
    expect(callArgs).not.toHaveProperty('searchVector');
  });
});
