import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("Health Check API", () => {
  it("should return status 200 with ok message", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
  });
});
