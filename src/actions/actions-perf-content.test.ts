import { describe, it, expect, vi, afterEach } from "vitest";
import { getArticlesOnThisDay } from "./actions";
import { db } from "@/db";

vi.mock("next/cache", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
  unstable_cache: (fn: any) => fn,
}));

vi.mock("@/db", () => {
  const mockChain = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
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

describe("getArticlesOnThisDay Performance Optimization", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should use conditional selection for content column to optimize bandwidth", async () => {
    await getArticlesOnThisDay(1, 1);

    expect(db.select).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const selectArgs = (db.select as any).mock.calls[0][0];

    // We expect 'content' to be present in the selection
    expect(selectArgs).toHaveProperty("content");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const contentField = selectArgs.content;

    // Verify it is a SQL object with CASE WHEN logic
    expect(contentField).toBeDefined();

    /* Check if it's a SQL object (has queryChunks) */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const isSqlObject: boolean = contentField && typeof contentField === "object" && "queryChunks" in contentField;

    if (!isSqlObject) {
      throw new Error(
        "Optimization missing: 'content' field is not a SQL object (likely a direct column reference). Expected CASE WHEN statement.",
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
    const chunks = (contentField as any).queryChunks;

    /* Inspect chunks to find SQL strings. */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const sqlParts = chunks
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
      .filter((c: any) => typeof c === "string" || (typeof c === "object" && "value" in c))
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return
      .map((c: any) => (typeof c === "string" ? c : c.value))
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .join(" ");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    expect(sqlParts.toUpperCase()).toContain("CASE");
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    expect(sqlParts.toUpperCase()).toContain("WHEN");
  });
});
