import { describe, it, expect, vi } from "vitest";
import { Navbar } from "./navbar";
import * as actions from "@/actions/actions";

// Mock the actions
vi.mock("@/actions/actions", () => ({
  getEssays: vi.fn(),
}));

// Mock NavbarUI
vi.mock("@/components/navbar-ui", () => ({
  NavbarUI: () => <div data-testid="navbar-ui" />
}));

describe("Navbar", () => {
  it("renders NavbarUI with essays", async () => {
    const getEssaysMock = vi.mocked(actions.getEssays);
    getEssaysMock.mockResolvedValue([{ id: 1, title: "Test Essay", groupName: "Test Group" }]);

    const result = await Navbar();
    expect(result).toBeDefined();
    expect(getEssaysMock).toHaveBeenCalledTimes(1);
  });
});
