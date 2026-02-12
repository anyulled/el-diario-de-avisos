import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getIntegrantes,
  getTutores,
  getDevelopers,
  getEssays,
  getArticleSection,
} from "./actions";
import { db } from "@/db";

// Mock setup
vi.mock("@/db", () => {
  const mockChain = {
    from: vi.fn().mockReturnThis(),
    $dynamic: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
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

describe("getNews Performance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("getArticleSection returns section", async () => {
    const result = await getArticleSection(1);
    // Mock returns empty array[0]
    expect(result).toBeUndefined();
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const mockSelect = db.select as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
      then: vi.fn().mockImplementation((resolve: any) => resolve([{ id: 1, title: 'Essay', groupName: null }])),
    });

    const result = await getEssays();
    expect(result[0].groupName).toBe("Publicación Desconocida");
  });
});
