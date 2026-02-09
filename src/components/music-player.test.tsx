import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MusicPlayer } from "./music-player";

/*
 * Mock matchMedia if needed (not used here)
 * Mock sessionStorage
 */
const sessionStorageMock = (() => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

describe("MusicPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageMock.clear();

    // Mock Audio methods
    window.HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
    window.HTMLMediaElement.prototype.pause = vi.fn();

    // Mock Image to avoid Next.js Image issues (though usually fine in tests)
  });

  it("renders player with initial state", () => {
    render(<MusicPlayer />);

    expect(screen.getByText("El Cáliz de una flor")).toBeDefined();
    expect(screen.getByText("Rafael Saumell")).toBeDefined();
  });

  it("toggles play/pause", async () => {
    render(<MusicPlayer />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    const playButton = buttons[1];

    // Wait for auto-play
    await waitFor(() => {
      expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });

    // Clear mocks to verify subsequent calls
    vi.mocked(window.HTMLMediaElement.prototype.play).mockClear();
    vi.mocked(window.HTMLMediaElement.prototype.pause).mockClear();

    // Click to pause
    fireEvent.click(playButton);
    expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();

    // Click to play again
    fireEvent.click(playButton);
    await waitFor(() => {
      expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });
  });

  it("changes track", async () => {
    render(<MusicPlayer />);

    const buttons = screen.getAllByRole("button");
    const nextButton = buttons[2];

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Un Bal en Reve")).toBeDefined();
    });
  });

  it("restores state from sessionStorage", () => {
    const state = {
      track: 1,
      playing: false,
      time: 10,
      volume: 0.5,
    };
    sessionStorageMock.getItem.mockReturnValue(JSON.stringify(state));

    render(<MusicPlayer />);

    expect(screen.getByText("Un Bal en Reve")).toBeDefined();
    expect(window.HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
  });
});
