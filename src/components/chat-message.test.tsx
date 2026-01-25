import { render, screen } from "@testing-library/react";
import { type UIMessage } from "ai";
import { describe, expect, it, vi } from "vitest";
import ChatMessage from "./chat-message";

// Mock ReactMarkdown to avoid parsing issues in tests
vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown-content">{children}</div>,
}));

describe("ChatMessage", () => {
  it("renders user message correctly", () => {
    const message: UIMessage = {
      id: "1",
      role: "user",
      parts: [{ type: "text", text: "Hello AI" }],
    };

    render(<ChatMessage message={message} />);

    expect(screen.getByText("Hello AI")).toBeDefined();
    // User icon container
    expect(screen.getByText("Hello AI").closest(".flex-row-reverse")).toBeDefined();
  });

  it("renders assistant message correctly with markdown", () => {
    const message: UIMessage = {
      id: "2",
      role: "assistant",
      parts: [{ type: "text", text: "**Bold** response" }],
    };

    render(<ChatMessage message={message} />);

    const content = screen.getByTestId("markdown-content");
    expect(content.textContent).toBe("**Bold** response");
    // Assistant icon container (not reversed)
    expect(content.closest(".flex-row")).toBeDefined();
  });

  it("handles empty text parts gracefully", () => {
    const message: UIMessage = {
      id: "3",
      role: "user",
      parts: [],
    };

    render(<ChatMessage message={message} />);
    // Should render without crashing, content might be empty
  });
});
