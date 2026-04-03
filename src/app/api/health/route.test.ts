import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("Health API Route", () => {
  it("should return status ok", async () => {
    const response = await GET();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ status: "ok" });
  });
});
