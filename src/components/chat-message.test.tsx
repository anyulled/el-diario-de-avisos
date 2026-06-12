import { render, screen } from "@testing-library/react";
import { type UIMessage } from "ai";
import { describe, expect, it, vi } from "vitest";
import ChatMessage from "./chat-message";
import React from "react";

// Mock ReactMarkdown to avoid parsing issues in tests, but let us test components
vi.mock("react-markdown", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, components }: { children: string; components?: Record<string, React.ElementType<any>> }) => {
    if (components && components.a) {
      const AComponent = components.a;
      return (
        <div data-testid="markdown-content">
          {children}
          <AComponent node={{}} href="https://example.com">
            Test Link
          </AComponent>
        </div>
      );
    }
    return <div data-testid="markdown-content">{children}</div>;
  },
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
    expect(screen.getByText("Hello AI").closest(".flex-row-reverse")).not.toBeNull();
  });

  it("renders assistant message correctly with markdown", () => {
    const message: UIMessage = {
      id: "2",
      role: "assistant",
      parts: [{ type: "text", text: "**Bold** response" }],
    };

    render(<ChatMessage message={message} />);

    const content = screen.getByTestId("markdown-content");
    expect(content.textContent).toContain("**Bold** response");
    expect(screen.getByText("Test Link")).toBeDefined();
    expect(screen.getByText("Test Link").getAttribute("href")).toBe("https://example.com");
    // Assistant icon container (not reversed)
    expect(content.closest(".flex-row")).not.toBeNull();
  });

  it("handles empty text parts gracefully", () => {
    const message: UIMessage = {
      id: "3",
      role: "user",
      parts: [],
    };

    const { container } = render(<ChatMessage message={message} />);

    // Check that the component rendered but has empty content
    const messageBubble = container.querySelector(".max-w-\\[80\\%\\]");
    expect(messageBubble).not.toBeNull();
    expect(messageBubble?.textContent).toBe("");
  });

  it("handles non-text parts gracefully", () => {
    const message: UIMessage = {
      id: "4",
      role: "assistant",
      parts: [
        { type: "text", text: "Text part" },
        // @ts-expect-error - testing invalid parts for coverage
        { type: "tool-invocation", toolName: "some-tool" },
      ],
    };

    render(<ChatMessage message={message} />);

    const content = screen.getByTestId("markdown-content");
    expect(content.textContent).toContain("Text part");
  });
});
