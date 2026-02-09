import { vi, describe, it, expect } from "vitest";
import { getEssayById } from "./actions";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-empty-function */

// Mock next/cache
vi.mock("next/cache", () => ({
  unstable_cache: (cb: any) => cb,
}));

// Mock db
const mockEssay = {
  id: 1,
  title: "Test Essay",
  subtitle: "Subtitle",
  content: Buffer.from("test content"),
  observations: "Obs",
  memberId: 1,
  pubId: 1,
};

vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve([mockEssay]),
        }),
      }),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  essays: {
    id: "id",
  },
  eq: () => {},
  and: () => {},
}));

vi.mock("drizzle-orm", () => ({
  eq: () => {},
  and: () => {},
  getTableColumns: () => ({}),
  sql: () => {},
}));

describe("getEssayById", () => {
  it("should return essay with Buffer content", async () => {
    const result = await getEssayById(1);
    expect(result).toBeDefined();
    expect(result?.id).toBe(1);
    expect(Buffer.isBuffer(result?.content)).toBe(true);
    expect(result?.content?.toString()).toBe("test content");
  });
});

/* eslint-enable @typescript-eslint/no-explicit-any */
/* eslint-enable @typescript-eslint/no-unsafe-return */
/* eslint-enable @typescript-eslint/no-empty-function */
