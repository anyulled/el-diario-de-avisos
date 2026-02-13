import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ChatInterface from "./chat-interface";

// Create a mock function that we can control
const mockUseChat = vi.fn();

// Mock the useChat hook - factory function must not reference external variables
vi.mock("@ai-sdk/react", () => ({
  useChat: () => mockUseChat() as unknown,
}));

// Mock ReactMarkdown
vi.mock("react-markdown", () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

describe("ChatInterface Session Storage", () => {
  const mocks = {
    setMessages: vi.fn(),
    sendMessage: vi.fn(),
  };

  beforeEach(() => {
    // Clear session storage before each test
    sessionStorage.clear();
    vi.clearAllMocks();

    mocks.setMessages = vi.fn();
    mocks.sendMessage = vi.fn();

    // Reset mock to default state
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: mocks.sendMessage,
      setMessages: mocks.setMessages,
      status: "idle",
    });
  });

  it("should load messages from session storage on mount", () => {
    const savedMessages = [
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", text: "Hello" }],
      },
      {
        id: "2",
        role: "assistant",
        parts: [{ type: "text", text: "Hi there!" }],
      },
    ];

    sessionStorage.setItem("chat-history", JSON.stringify(savedMessages));

    render(<ChatInterface />);

    expect(mocks.setMessages).toHaveBeenCalledWith(savedMessages);
  });

  it("should handle corrupted session storage data gracefully", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // Mocked implementation for test
    });

    sessionStorage.setItem("chat-history", "invalid json{");

    render(<ChatInterface />);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to parse saved messages:", expect.any(Error));
    expect(mocks.setMessages).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it("should save messages to session storage when messages change", async () => {
    const messages = [
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", text: "Test message" }],
      },
    ];

    // Re-render with messages
    mockUseChat.mockReturnValue({
      messages,
      sendMessage: mocks.sendMessage,
      setMessages: mocks.setMessages,
      status: "idle",
    });

    render(<ChatInterface />);

    // Wait for hydration and save
    await waitFor(
      () => {
        const saved = sessionStorage.getItem("chat-history");
        expect(saved).toBeTruthy();
      },
      { timeout: 1000 },
    );

    const saved = sessionStorage.getItem("chat-history");
    expect(JSON.parse(saved ?? "null")).toEqual(messages);
  });

  it("should not save empty messages array to session storage initially", async () => {
    render(<ChatInterface />);

    // Wait a bit to ensure no save happens
    await new Promise((resolve) => setTimeout(resolve, 100));

    const saved = sessionStorage.getItem("chat-history");
    expect(saved).toBeNull();
  });

  it("should clear session storage when clear button is clicked", () => {
    const messages = [
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", text: "Test" }],
      },
    ];

    sessionStorage.setItem("chat-history", JSON.stringify(messages));

    render(<ChatInterface />);

    const clearButton = screen.getByTitle("Limpiar conversación");
    fireEvent.click(clearButton);

    expect(mocks.setMessages).toHaveBeenCalledWith([]);
    expect(sessionStorage.getItem("chat-history")).toBeNull();
  });

  it("should persist messages across component remounts", async () => {
    const messages = [
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", text: "Persisted message" }],
      },
    ];

    // First render with messages
    mockUseChat.mockReturnValue({
      messages,
      sendMessage: mocks.sendMessage,
      setMessages: mocks.setMessages,
      status: "idle",
    });

    const { unmount } = render(<ChatInterface />);

    // Wait for save
    await waitFor(() => {
      expect(sessionStorage.getItem("chat-history")).toBeTruthy();
    });

    unmount();

    // Reset mocks
    mocks.setMessages.mockClear();

    // Second render should load from storage
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: mocks.sendMessage,
      setMessages: mocks.setMessages,
      status: "idle",
    });

    render(<ChatInterface />);

    expect(mocks.setMessages).toHaveBeenCalledWith(messages);
  });

  it("should handle navigation and return scenario", async () => {
    // Simulate user having a conversation
    const conversationMessages = [
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", text: "Tell me about articles" }],
      },
      {
        id: "2",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Here's an article: [Concert](/article/123)",
          },
        ],
      },
    ];

    mockUseChat.mockReturnValue({
      messages: conversationMessages,
      sendMessage: mocks.sendMessage,
      setMessages: mocks.setMessages,
      status: "idle",
    });

    const { unmount } = render(<ChatInterface />);

    // Wait for messages to be saved
    await waitFor(() => {
      const saved = sessionStorage.getItem("chat-history");
      expect(saved).toBeTruthy();
    });

    // User navigates away (unmount)
    unmount();

    // User navigates back (new mount)
    mocks.setMessages.mockClear();
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: mocks.sendMessage,
      setMessages: mocks.setMessages,
      status: "idle",
    });

    render(<ChatInterface />);

    // Messages should be restored
    expect(mocks.setMessages).toHaveBeenCalledWith(conversationMessages);
  });

  it("should send a message when form is submitted", () => {
    render(<ChatInterface />);

    const input = screen.getByPlaceholderText("Escribe tu consulta sobre el archivo...");
    const form = input.closest("form");

    fireEvent.change(input, { target: { value: "New message" } });
    if (form) {
      fireEvent.submit(form);
    }

    expect(mocks.sendMessage).toHaveBeenCalledWith({
      role: "user",
      parts: [{ type: "text", text: "New message" }],
    });
  });

  it("should not send message if input is empty", () => {
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText("Escribe tu consulta sobre el archivo...");
    const form = input.closest("form");
    fireEvent.change(input, { target: { value: "   " } });
    if (form) fireEvent.submit(form);
    expect(mocks.sendMessage).not.toHaveBeenCalled();
  });

  it("should not send message if status is streaming (isLoading)", () => {
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: mocks.sendMessage,
      setMessages: mocks.setMessages,
      status: "streaming",
    });
    render(<ChatInterface />);
    const input = screen.getByPlaceholderText("Escribe tu consulta sobre el archivo...");
    const form = input.closest("form");
    fireEvent.change(input, { target: { value: "Valid message" } });
    if (form) fireEvent.submit(form);
    expect(mocks.sendMessage).not.toHaveBeenCalled();
  });
});
