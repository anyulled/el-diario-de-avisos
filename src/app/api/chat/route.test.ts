import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// Mock dependencies
vi.mock("@/lib/vector-store", () => ({
  findSimilarArticles: vi.fn(),
}));

vi.mock("@ai-sdk/groq", () => ({
  createGroq: vi.fn(),
}));

vi.mock("ai", () => ({
  streamText: vi.fn(),
}));

describe("Chat API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should process chat request with context from vector store", async () => {
    const { findSimilarArticles } = await import("@/lib/vector-store");
    const { createGroq } = await import("@ai-sdk/groq");
    const { streamText } = await import("ai");

    // Mock similar articles with required 'type' and 'contentSnippet' fields
    vi.mocked(findSimilarArticles).mockResolvedValue([
      {
        id: 1,
        title: "Concierto en el Teatro Municipal",
        date: "1885-03-15",
        similarity: 0.85,
        type: "article",
        contentSnippet: "El concierto fue un éxito...",
      },
      {
        id: 2,
        title: "Ópera Italiana en Caracas",
        date: "1886-07-20",
        similarity: 0.78,
        type: "article",
        contentSnippet: "La ópera italiana...",
      },
    ]);

    // Mock Groq client
    const mockGroqModel = vi.fn();
    vi.mocked(createGroq).mockReturnValue(mockGroqModel as never);

    // Mock streamText response
    const mockStreamResponse = {
      toUIMessageStreamResponse: vi.fn().mockReturnValue(
        new Response("mock stream", {
          headers: { "Content-Type": "text/event-stream" },
        }),
      ),
    };
    vi.mocked(streamText).mockReturnValue(mockStreamResponse as never);

    // Create mock request
    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            parts: [{ type: "text", text: "¿Qué conciertos hubo en 1885?" }],
          },
        ],
      }),
    });

    const response = await POST(mockRequest);

    // Verify vector store was called with limit 5
    expect(findSimilarArticles).toHaveBeenCalledWith("¿Qué conciertos hubo en 1885?", 5);

    // Verify Groq was initialized
    expect(createGroq).toHaveBeenCalledWith({
      apiKey: "test-groq-key",
    });

    // Verify streamText was called with proper context
    expect(streamText).toHaveBeenCalled();
    const callArgs = vi.mocked(streamText).mock.calls[0][0];

    // Verify the system prompt includes the context articles
    expect(callArgs.system).toContain("Concierto en el Teatro Municipal");
    expect(callArgs.system).toContain("1885-03-15");
    expect(callArgs.messages).toBeDefined();

    // Verify response
    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
  });

  it("should handle requests with no similar articles found", async () => {
    const { findSimilarArticles } = await import("@/lib/vector-store");
    const { createGroq } = await import("@ai-sdk/groq");
    const { streamText } = await import("ai");

    // Mock empty results
    vi.mocked(findSimilarArticles).mockResolvedValue([]);

    const mockGroqModel = vi.fn();
    vi.mocked(createGroq).mockReturnValue(mockGroqModel as never);

    const mockStreamResponse = {
      toUIMessageStreamResponse: vi.fn().mockReturnValue(
        new Response("mock stream", {
          headers: { "Content-Type": "text/event-stream" },
        }),
      ),
    };
    vi.mocked(streamText).mockReturnValue(mockStreamResponse as never);

    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            parts: [{ type: "text", text: "Random query" }],
          },
        ],
      }),
    });

    await POST(mockRequest);

    // Verify system prompt includes fallback message
    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("No se encontraron artículos específicos"),
      }),
    );
  });

  it("should extract content from UIMessage parts correctly", async () => {
    const { findSimilarArticles } = await import("@/lib/vector-store");
    const { createGroq } = await import("@ai-sdk/groq");
    const { streamText } = await import("ai");

    vi.mocked(findSimilarArticles).mockResolvedValue([]);

    const mockGroqModel = vi.fn();
    vi.mocked(createGroq).mockReturnValue(mockGroqModel as never);

    const mockStreamResponse = {
      toUIMessageStreamResponse: vi.fn().mockReturnValue(
        new Response("mock stream", {
          headers: { "Content-Type": "text/event-stream" },
        }),
      ),
    };
    vi.mocked(streamText).mockReturnValue(mockStreamResponse as never);

    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            parts: [
              { type: "text", text: "First part " },
              { type: "text", text: "second part" },
            ],
          },
        ],
      }),
    });

    await POST(mockRequest);

    // The content extraction should handle the parts array
    // This is a regression test for the UIMessage.parts structure
    expect(findSimilarArticles).toHaveBeenCalled();
  });

  it("should use Groq llama-3.3-70b-versatile model", async () => {
    const { findSimilarArticles } = await import("@/lib/vector-store");
    const { createGroq } = await import("@ai-sdk/groq");
    const { streamText } = await import("ai");

    vi.mocked(findSimilarArticles).mockResolvedValue([]);

    const mockGroqModel = vi.fn();
    vi.mocked(createGroq).mockReturnValue(mockGroqModel as never);

    const mockStreamResponse = {
      toUIMessageStreamResponse: vi.fn().mockReturnValue(
        new Response("mock stream", {
          headers: { "Content-Type": "text/event-stream" },
        }),
      ),
    };
    vi.mocked(streamText).mockReturnValue(mockStreamResponse as never);

    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            parts: [{ type: "text", text: "Test" }],
          },
        ],
      }),
    });

    await POST(mockRequest);

    // Verify the correct model is used
    expect(mockGroqModel).toHaveBeenCalledWith("llama-3.3-70b-versatile");
  });

  it("should include article IDs and linking instructions in system prompt", async () => {
    const { findSimilarArticles } = await import("@/lib/vector-store");
    const { createGroq } = await import("@ai-sdk/groq");
    const { streamText } = await import("ai");

    // Mock similar articles with IDs, type, and contentSnippet
    vi.mocked(findSimilarArticles).mockResolvedValue([
      {
        id: 42,
        title: "Gran Concierto de Ópera",
        date: "1887-05-10",
        similarity: 0.92,
        type: "article",
        contentSnippet: "El gran concierto de ópera...",
      },
    ]);

    const mockGroqModel = vi.fn();
    vi.mocked(createGroq).mockReturnValue(mockGroqModel as never);

    const mockStreamResponse = {
      toUIMessageStreamResponse: vi.fn().mockReturnValue(
        new Response("mock stream", {
          headers: { "Content-Type": "text/event-stream" },
        }),
      ),
    };
    vi.mocked(streamText).mockReturnValue(mockStreamResponse as never);

    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            parts: [{ type: "text", text: "Tell me about opera" }],
          },
        ],
      }),
    });

    await POST(mockRequest);

    expect(streamText).toHaveBeenCalled();
    const callArgs = vi.mocked(streamText).mock.calls[0][0];

    // Verify article link is included in context (current format uses path not [ID: XX])
    expect(callArgs.system).toContain("/article/42");
    expect(callArgs.system).toContain("Gran Concierto de Ópera");

    // Verify linking instructions are present
    expect(callArgs.system).toContain("CITACIÓN DE FUENTES");
    expect(callArgs.system).toContain("/article/123");
    expect(callArgs.system).toContain("INCLUYE el enlace");
  });

  it("should fall back to message content if parts are missing", async () => {
    const { findSimilarArticles } = await import("@/lib/vector-store");
    const { createGroq } = await import("@ai-sdk/groq");
    const { streamText } = await import("ai");

    vi.mocked(findSimilarArticles).mockResolvedValue([]);

    const mockGroqModel = vi.fn();
    vi.mocked(createGroq).mockReturnValue(mockGroqModel as never);

    const mockStreamResponse = {
      toUIMessageStreamResponse: vi.fn().mockReturnValue(
        new Response("mock stream", {
          headers: { "Content-Type": "text/event-stream" },
        }),
      ),
    };
    vi.mocked(streamText).mockReturnValue(mockStreamResponse as never);

    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: "Direct content without parts",
          },
        ],
      }),
    });

    await POST(mockRequest);

    expect(findSimilarArticles).toHaveBeenCalledWith("Direct content without parts", 5);
  });
});
