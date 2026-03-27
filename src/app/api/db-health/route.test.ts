import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { db } from "@/db";

vi.mock("@/db", () => ({
  db: {
    execute: vi.fn(),
  },
}));

describe("Database Health Check API", () => {
  it("should return status 200 with ok message when DB is healthy", async () => {
    vi.mocked(db.execute).mockResolvedValueOnce({} as any);

    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
  });

  it("should return status 503 with error message when DB is unhealthy", async () => {
    const errorMsg = "Quota exceeded";
    vi.mocked(db.execute).mockRejectedValueOnce(new Error(errorMsg));

    const response = await GET();
    expect(response.status).toBe(503);

    const body = await response.json();
    expect(body).toEqual({ status: "error", message: errorMsg });
  });
});
