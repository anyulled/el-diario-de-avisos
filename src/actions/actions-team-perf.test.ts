/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { getIntegrantes, getTutores, getDevelopers } from "./team";
import { db } from "@/db";

// Mock the database
vi.mock("@/db", () => ({
  db: {
    execute: vi.fn().mockResolvedValue({ rows: [{ estimate: 100 }] }),
      select: vi.fn(() => ({
      from: vi.fn(() => ({
        leftJoin: vi.fn(),
      })),
    })),
  },
}));

// Mock unstable_cache to execute the callback immediately
vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
}));

// Mock getTableColumns
vi.mock("drizzle-orm", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    getTableColumns: vi.fn(() => ({})),
  };
});

describe("Team Actions Caching Optimization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getIntegrantes", () => {
    it("fetches members successfully", async () => {
      const mockMembers = [
        { id: 1, firstName: "John", lastName: "Doe", publicationName: "Pub A" },
      ];

      const leftJoinMock = vi.fn().mockResolvedValue(mockMembers);
      const fromMock = vi.fn(() => ({ leftJoin: leftJoinMock }));
      const selectMock = vi.fn(() => ({ from: fromMock }));

      vi.mocked(db.select).mockImplementation(selectMock as any);

      const result = await getIntegrantes();

      expect(result).toEqual(mockMembers);
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe("getTutores", () => {
    it("fetches tutors successfully", async () => {
      const mockTutors = [{ id: 1, names: "Jane Doe" }];

      const fromMock = vi.fn().mockResolvedValue(mockTutors);
      const selectMock = vi.fn(() => ({ from: fromMock }));

      vi.mocked(db.select).mockImplementation(selectMock as any);

      const result = await getTutores();

      expect(result).toEqual(mockTutors);
      expect(db.select).toHaveBeenCalled();
    });
  });

  describe("getDevelopers", () => {
    it("fetches developers successfully", async () => {
      const mockDevelopers = [{ id: 1, firstName: "Dev", lastName: "Eloper" }];

      const fromMock = vi.fn().mockResolvedValue(mockDevelopers);
      const selectMock = vi.fn(() => ({ from: fromMock }));

      vi.mocked(db.select).mockImplementation(selectMock as any);

      const result = await getDevelopers();

      expect(result).toEqual(mockDevelopers);
      expect(db.select).toHaveBeenCalled();
    });
  });
});
/* eslint-enable @typescript-eslint/no-explicit-any */
/* eslint-enable @typescript-eslint/no-unsafe-return */
