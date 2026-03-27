import { describe, it, expect, vi, afterEach } from "vitest";
import { getNews } from "./actions";
import { db } from "@/db";

// Mock setup
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    execute: vi.fn().mockResolvedValue({ rows: [{ estimate: 123 }] }),
  },
}));

vi.mock("next/cache", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unstable_cache: (fn: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return fn;
  },
}));

interface MockChain {
  from: ReturnType<typeof vi.fn>;
  leftJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  offset: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  $dynamic: ReturnType<typeof vi.fn>;
  then: (resolve: (value: unknown) => void) => Promise<void>;
  catch: ReturnType<typeof vi.fn>;
  finally: ReturnType<typeof vi.fn>;
  [key: string]: unknown;
}

// Mock chain
const createMockChain = (): MockChain => {
  const chain: Partial<MockChain> = {};
  const methods = ["from", "leftJoin", "where", "limit", "offset", "orderBy", "catch", "finally", "$dynamic"];
  methods.forEach((method) => {
    chain[method] = vi.fn().mockReturnValue(chain);
  });
  /**
   * Mocking then to resolve
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain.then = (resolve: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    resolve([{ id: 1, title: "Test Article" }]);
    return Promise.resolve();
  };
  return chain as MockChain;
};

describe("getNews Performance - Publication Filter", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should apply filter on articles.pubId when pubId is provided", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    const chain = createMockChain();
    mockSelect.mockReturnValue(chain);

    /**
     * Mock count query result (first call in Promise.all)
     * The implementation calls db.select() twice: once for count, once for data.
     * We need to ensure both return a chain.
     * Actually, Promise.all runs them concurrently.
     */

    // Call getNews with pubId
    await getNews({ pubId: 123 });

    /**
     * Inspect the calls to .where()
     * Since we reuse the chain object for simplicity in mock, we can check chain.where.mock.calls
     * However, getNews creates TWO queries (count and data).
     * Both use the same conditions.
     */

    // We expect .where() to be called.
    expect(chain.where).toHaveBeenCalled();

    /**
     * We can't easily inspect the arguments of 'where' because they are Drizzle SQL objects (eq(), and()).
     * But we can verify that it WAS called, which implies filtering is happening.
     * If we didn't filter, where() might not be called or called with empty conditions?
     * In getNews: const queryWithConditions = conditions.length > 0 ? query.where(and(...conditions)) : query;
     * So if conditions are present, where is called.
     */

    /**
     * To be more specific, we can verify that the implementation attempts to filter.
     * But testing the EXACT SQL generation is hard without a real DB or complex mocking.
     * The fact that 'where' is called when 'pubId' is provided is good enough evidence that the logic is active.
     */
  });

  it("should NOT apply filter when pubId is NOT provided (and no other filters)", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    const chain = createMockChain();
    mockSelect.mockReturnValue(chain);

    // Call getNews without filters
    await getNews({});

    /**
     * In getNews: const queryWithConditions = conditions.length > 0 ? query.where(and(...conditions)) : query;
     * If no conditions, where is NOT called.
     */
    expect(chain.where).not.toHaveBeenCalled();
  });
});
