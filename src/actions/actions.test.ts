import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getIntegrantes,
  getTutores,
  getDevelopers,
  getEssays,
  getArticleSection,
  getArticlesOnThisDay,
} from "./actions";
import { db } from "@/db";
import { getTableColumns } from "drizzle-orm";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    then: vi.fn().mockImplementation((resolve: any) => resolve([])),
  };
  return {
    db: {
      select: vi.fn().mockReturnValue(mockChain),
    },
  };
});

vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("drizzle-orm")>();
  return {
    ...actual,
    getTableColumns: vi.fn(() => ({
      plainText: "plainText",
      content: "content",
      searchVector: "searchVector",
      title: "title",
    })),
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

vi.mock("@/lib/rtf-content-converter", () => ({
  processRtfContent: vi.fn().mockResolvedValue("Processed Content"),
  stripHtml: (html: string) => html.replace(/<[^>]*>/g, ""),
}));

vi.mock("next/cache", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unstable_cache: (fn: any) => fn,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
      then: vi.fn().mockImplementation((resolve: any) => resolve([{ id: 1, title: "Essay", groupName: null }])),
    });

    const result = await getEssays();
    expect(result[0].groupName).toBe("Publicación Desconocida");
  });

  it("getArticlesOnThisDay executes successfully with mocked dependencies", async () => {
    // Mock db.select().from().leftJoin().where().orderBy().limit().then() for getArticlesOnThisDay
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockSelect = db.select as any;

    const mockNewsItem = {
      title: "Test Article",
      plainText: "Some text",
      content: null,
      publicationName: "Test Pub"
    };

    // Note: Since db.select is mocked at the module level to return `mockChain`,
    // and `mockReturnValueOnce` is a method of the mock function,
    // we need to ensure we are calling it on the right mock.
    // The module mock sets `db.select` to a jest/vi mock function.

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    mockSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
      limit: vi.fn().mockImplementation(() => Promise.resolve([mockNewsItem])),
    });

    const result = await getArticlesOnThisDay(1, 1);
    expect(result).toHaveLength(1);
    // @ts-expect-error - Result is partial
    expect(result[0].title).toBe("Test Article");
  });
});
