import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { db } from "@/db";

vi.mock("@/db", () => ({
  db: {
    execute: vi.fn(),
  },
}));

describe("DB Health API Route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return status 200 when database is healthy", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(db.execute).mockResolvedValueOnce({ rows: [{ "?column?": 1 }] } as any);
    const response = await GET();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ status: "ok" });
  });

  it("should return status 503 when database query fails", async () => {
    vi.mocked(db.execute).mockRejectedValueOnce(new Error("Quota exceeded"));
    const response = await GET();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data).toEqual({ status: "error", message: "Database unavailable" });
  });
});
