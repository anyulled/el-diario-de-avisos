import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

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

    vi.mocked(findSimilarArticles).mockResolvedValue([
      {
        id: 1,
        title: "Concierto en el Teatro Municipal",
        date: "1885-03-15",
        similarity: 0.85,
        type: "article",
        contentSnippet: "El concierto fue un éxito...",
        publicationName: "El Diario de Avisos",
      },
      {
        id: 2,
        title: "Ópera Italiana en Caracas",
        date: "1886-07-20",
        similarity: 0.78,
        type: "article",
        contentSnippet: "La ópera italiana...",
        publicationName: "La Opinión Nacional",
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
            parts: [{ type: "text", text: "¿Qué conciertos hubo en 1885?" }],
          },
        ],
      }),
    });

    const response = await POST(mockRequest);

    expect(findSimilarArticles).toHaveBeenCalledWith("¿Qué conciertos hubo en 1885?", 5);

    expect(createGroq).toHaveBeenCalledWith({
      apiKey: "test-groq-key",
    });

    expect(streamText).toHaveBeenCalled();
    const callArgs = vi.mocked(streamText).mock.calls[0][0];

    expect(callArgs.system).toContain("Concierto en el Teatro Municipal");
    expect(callArgs.system).toContain("1885-03-15");
    expect(callArgs.system).toContain("Fuente: El Diario de Avisos");
    expect(callArgs.messages).toBeDefined();

    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");
  });

  it("should handle requests with no similar articles found", async () => {
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
            parts: [{ type: "text", text: "Random query" }],
          },
        ],
      }),
    });

    await POST(mockRequest);

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: expect.stringContaining("NO SE ENCONTRARON REGISTROS EN EL ARCHIVO") as unknown as string,
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

    /*
     * The content extraction should handle the parts array
     * This is a regression test for the UIMessage.parts structure
     */
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

    expect(mockGroqModel).toHaveBeenCalledWith("llama-3.3-70b-versatile");
  });

  it("should include article IDs and linking instructions in system prompt", async () => {
    const { findSimilarArticles } = await import("@/lib/vector-store");
    const { createGroq } = await import("@ai-sdk/groq");
    const { streamText } = await import("ai");

    vi.mocked(findSimilarArticles).mockResolvedValue([
      {
        id: 42,
        title: "Gran Concierto de Ópera",
        date: "1887-05-10",
        similarity: 0.92,
        type: "article",
        contentSnippet: "El gran concierto de ópera...",
        publicationName: "El Diario de Avisos",
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

    expect(callArgs.system).toContain("/article/42");
    expect(callArgs.system).toContain("Gran Concierto de Ópera");

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

  it("should handle unexpected errors in POST", async () => {
    const { findSimilarArticles } = await import("@/lib/vector-store");
    vi.mocked(findSimilarArticles).mockRejectedValue(new Error("Database error"));

    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", parts: [{ type: "text", text: "Error test" }] }],
      }),
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(500);
    const result = (await response.json()) as { error: string };
    expect(result.error).toBe("Ha ocurrido un error en vuestra consulta.");
  });

  it("should fall back to empty string if no content or parts found", async () => {
    const { findSimilarArticles } = await import("@/lib/vector-store");
    vi.mocked(findSimilarArticles).mockResolvedValue([]);

    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [
          {
            // No content, no parts
            role: "user",
          },
        ],
      }),
    });

    await POST(mockRequest);
    expect(findSimilarArticles).toHaveBeenCalledWith("", 5);
  });

  it("should handle message with empty parts array", async () => {
    const { findSimilarArticles } = await import("@/lib/vector-store");
    vi.mocked(findSimilarArticles).mockResolvedValue([]);

    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", parts: [] }],
      }),
    });

    await POST(mockRequest);
    expect(findSimilarArticles).toHaveBeenCalledWith("", 5);
  });

  it("should handle message with parts but no text part", async () => {
    const { findSimilarArticles } = await import("@/lib/vector-store");
    vi.mocked(findSimilarArticles).mockResolvedValue([]);

    const mockRequest = new Request("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", parts: [{ type: "image", image: "base64" }] }],
      }),
    });

    await POST(mockRequest);
    expect(findSimilarArticles).toHaveBeenCalledWith("", 5);
  });
});
