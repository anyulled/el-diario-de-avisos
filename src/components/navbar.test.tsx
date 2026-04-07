import { describe, it, expect, vi, beforeEach } from "vitest";
import { Navbar } from "./navbar";
import * as actions from "@/actions/actions";

// Mock the actions
vi.mock("@/actions/actions", () => ({
  getEssays: vi.fn(),
}));

describe("Navbar Performance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with essays", async () => {
    const getEssaysMock = vi.mocked(actions.getEssays);
    getEssaysMock.mockResolvedValue([{ id: 1, title: "Test Essay", groupName: "Test Group" }]);

    // First Call
    await Navbar();
    expect(getEssaysMock).toHaveBeenCalledTimes(1);
  });
});
