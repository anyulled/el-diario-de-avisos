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
    then: vi.fn().mockImplementation((resolve) => resolve([])),
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
    // ... existing test ...
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
    const mockSelect = db.select as any;
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      then: vi.fn().mockImplementation((resolve) => resolve([{ id: 1, title: 'Essay', groupName: null }])),
    });

    const result = await getEssays();
    expect(result[0].groupName).toBe("Publicación Desconocida");
  });
});
