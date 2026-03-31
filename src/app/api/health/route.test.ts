import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  it("should return 200 OK", async () => {
    const response = await GET();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await response.json();

    expect(response.status).toBe(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(data.status).toBe("ok");
  });
});
