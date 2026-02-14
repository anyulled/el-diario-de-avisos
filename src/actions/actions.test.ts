import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getNews,
  getIntegrantes,
  getTutores,
  getDevelopers,
  getArticleById,
  getEssays,
  getEssayById,
  getArticleSection,
  getArticlesOnThisDay,
} from "./actions";
import { db } from "@/db";

// Mock next/cache
vi.mock("next/cache", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
  unstable_cache: (fn: any) => fn,
}));

// Mock setup
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

vi.mock("@/db", () => {
  const mockChain = {
    from: vi.fn().mockReturnThis(),
    $dynamic: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
    then: vi.fn().mockImplementation((resolve: any) => resolve([])),
  };
  return {
    db: {
      select: vi.fn().mockReturnValue(mockChain),
    },
  };
});

vi.mock("@/db/schema", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/db/schema")>();
  return {
    ...actual,
  };
});

vi.mock("@/lib/date-range", () => ({
  normalizeDateRange: () => ({ start: null, end: null, isValidRange: true }),
}));

vi.mock("@/lib/news-order", () => ({
  getNewsOrderBy: () => [],
}));

type MockResult = Record<string, unknown>[];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface MockChain {
  from: () => MockChain;
  $dynamic: () => MockChain;
  where: () => MockChain;
  orderBy: () => MockChain;
  limit: () => MockChain;
  offset: () => MockChain;
  leftJoin: () => MockChain;
  then: (resolve: (val: MockResult) => void, reject: (err: unknown) => void) => Promise<void>;
}

describe("getNews Performance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getArticleSection returns section", async () => {
    const result = await getArticleSection(1);
    expect(result).toBeUndefined(); // Mock returns empty array[0]
  });

  it("should run queries in parallel", async () => {
    const start = Date.now();

    // Mock implementations with delays
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const mockSelect = db.select as any;

    // We need to mock the chain for each call.
    // getNews makes two calls: count and query.
    // We want to verify they happen in parallel.

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      $dynamic: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      offset: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
      then: vi.fn().mockImplementation(async (resolve: any) => {
        await delay(100);
        resolve([]);
      }),
    });

    await getNews({});
    const duration = Date.now() - start;

    // If sequential: 100 + 100 = 200ms
    // If parallel: max(100, 100) = 100ms
    // Allow some overhead, but ensure it's faster than sequential
    expect(duration).toBeLessThan(190);
  });

  it("getIntegrantes returns data", async () => {
    const result = await getIntegrantes();
    expect(result).toBeDefined();
  });

  it("getTutores returns data", async () => {
    const result = await getTutores();
    expect(result).toBeDefined();
  });

  it("getDevelopers returns data", async () => {
    const result = await getDevelopers();
    expect(result).toBeDefined();
  });

  it("getEssays returns data with fallback groupName", async () => {
    // Mock db.select().from().leftJoin().then()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const mockSelect = db.select as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
      then: vi.fn().mockImplementation((resolve: any) => resolve([{ id: 1, title: "Essay", groupName: null }])),
    });

    const result = await getEssays();
    expect(result[0].groupName).toBe("Publicación Desconocida");
  });

  // Tests for other functions to increase coverage
  it("getArticleById returns article", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const mockSelect = db.select as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
      then: vi.fn().mockImplementation((resolve: any) => resolve([{ id: 1, title: "Article" }])),
    });
    const result = await getArticleById(1);
    expect(result).toBeDefined();
  });

  it("getEssayById returns essay", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const mockSelect = db.select as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
      then: vi.fn().mockImplementation((resolve: any) => resolve([{ id: 1, title: "Essay" }])),
    });
    const result = await getEssayById(1);
    expect(result).toBeDefined();
  });

  it("getArticlesOnThisDay returns articles", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const mockSelect = db.select as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    mockSelect.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
      then: vi.fn().mockImplementation((resolve: any) => resolve([{ id: 1, title: "On this day" }])),
    });
    const result = await getArticlesOnThisDay(1, 1);
    expect(result).toBeDefined();
  });
});
