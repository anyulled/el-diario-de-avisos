import { describe, it, expect, vi } from "vitest";
import {
    getLatestContent,
    convertToModelMessages,
    constructSystemPrompt,
    validateAndReturnStream,
    executeWithFallback,
    handleError,
    getRelevantContext,
    formatContextString
} from "./chat-request-runner";

vi.mock("@/lib/vector-store", () => ({
    findSimilarArticles: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/ai", () => ({
    generateEmbedding: vi.fn(),
}));

describe("chat-request-runner", () => {
    describe("getLatestContent", () => {
        it("should return empty string for no messages", () => {
            expect(getLatestContent([])).toBe("");
        });

        it("should prioritize parts over content", () => {
            const messages = [{
                id: "1",
                role: "user",
                content: "direct content",
                parts: [{ type: "text", text: "part content" }]
            }];
            expect(getLatestContent(messages)).toBe("part content");
        });

        it("should handle multiple text parts", () => {
            const messages = [{
                id: "1",
                role: "user",
                content: "",
                parts: [
                    { type: "text", text: "part 1" },
                    { type: "text", text: " part 2" }
                ]
            }];
            expect(getLatestContent(messages)).toBe("part 1 part 2");
        });
    });

    describe("convertToModelMessages", () => {
        it("should convert simple messages", () => {
            const messages = [{ id: "1", role: "user", content: "hello" }];
            const result = convertToModelMessages(messages);
            expect(result).toHaveLength(1);
            expect(result[0].role).toBe("user");
            expect(result[0].content).toEqual([{ type: "text", text: "hello" }]);
        });

        it("should handle empty content/parts", () => {
            const messages = [{ id: "1", role: "user", content: "" }];
            const result = convertToModelMessages(messages);
            expect(result[0].content).toEqual([{ type: "text", text: "" }]);
        });
    });

    describe("constructSystemPrompt", () => {
        it("should include context when available", () => {
            const articles = [{
                id: 1,
                title: "Test Article",
                contentSnippet: "Snippet",
                type: "article" as const,
                score: 0.9,
                date: "2023-01-01",
                similarity: 0.9
            }];
            const prompt = constructSystemPrompt(articles);
            expect(prompt).toContain("Test Article");
            expect(prompt).toContain("/article/1");
            expect(prompt).toContain("Snippet");
        });

        it("should show anti-alucination message for no context", () => {
            const prompt = constructSystemPrompt([]);
            expect(prompt).toContain("NO SE ENCONTRARON REGISTROS");
        });
    });

    describe("validateAndReturnStream", () => {
        it("should pass through valid stream", async () => {
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode('0:{"type":"text-delta","text":"hello"}'));
                    controller.close();
                }
            });
            const response = new Response(mockStream);
            const validatedResponse = await validateAndReturnStream(response);
            const reader = validatedResponse.body?.getReader();
            if (!reader) throw new Error("No reader");
            const { value } = await reader.read();
            if (!value) throw new Error("No value");
            expect(new TextDecoder().decode(value)).toContain("text-delta");
        });

        it("should throw on error chunks", async () => {
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode('0:{"type":"error","message":"rate limit"}'));
                    controller.close();
                }
            });
            const response = new Response(mockStream);
            await expect(validateAndReturnStream(response)).rejects.toThrow("Stream validation failed");
        });

        it("should handle unexpected end of stream during check", async () => {
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.close();
                }
            });
            const response = new Response(mockStream);
            const validatedResponse = await validateAndReturnStream(response);
            expect(validatedResponse.status).toBe(200);
        });

        it("should handle multiple chunks before validating", async () => {
            const mockStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode('0:{"type":"other"}'));
                    controller.enqueue(new TextEncoder().encode('1:{"type":"text-delta","text":"working"}'));
                    controller.close();
                }
            });
            const response = new Response(mockStream);
            const validatedResponse = await validateAndReturnStream(response);
            const reader = validatedResponse.body?.getReader();
            if (!reader) throw new Error("No reader");

            /* Read first chunk */
            await reader.read();
            /* Read second chunk */
            const { value } = await reader.read();
            if (!value) throw new Error("No value");
            expect(new TextDecoder().decode(value)).toContain("working");
        });
    });

    describe("executeWithFallback", () => {
        it("should throw if chain is empty", async () => {
            await expect(executeWithFallback([], [], "prompt")).rejects.toThrow("All AI providers failed");
        });

        it("should try the first provider in the chain", async () => {
            const chain = [{ provider: "invalid", modelId: "m1" }];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await expect(executeWithFallback(chain as any, [], "prompt")).rejects.toThrow();
        });
    });

    describe("handleError", () => {
        it("should fallback on rate limit (429)", async () => {
            const chain = [
                { provider: "p1", modelId: "m1" },
                { provider: "p2", modelId: "m2" }
            ];
            const error = { statusCode: 429, message: "Too many requests" };

            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (handleError as (error: unknown, chain: unknown[], messages: unknown[], prompt: string) => Promise<Response>)(error, chain as any, [], "prompt");
            } catch (e) {
                expect((e as { statusCode?: number }).statusCode).not.toBe(429);
            }
        });

        it("should not fallback on 400 client error", async () => {
            const chain = [{ provider: "p1", modelId: "m1" }];
            const error = { statusCode: 400, message: "Bad Request" };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await expect((handleError as (error: unknown, chain: unknown[], messages: unknown[], prompt: string) => Promise<Response>)(error, chain as any, [], "prompt")).rejects.toThrow("Bad Request");
        });
    });

    describe("getRelevantContext", () => {
        it("should return empty array if content is empty space", async () => {
            expect(await getRelevantContext("   ")).toEqual([]);
        });

    });

    describe("formatContextString", () => {
        it("should format essays correctly", () => {
            const results: Array<{ id: number; title: string; type: string; contentSnippet: string; publicationName: string; date: string; similarity: number }> = [
                { id: 1, title: "Essay 1", type: "essay", contentSnippet: "Content...", publicationName: "Pub 1", date: "2023-01-01", similarity: 0.9 }
            ];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const output = formatContextString(results as any);
            expect(output).toContain("Ensayo");
            expect(output).toContain("Essay 1");
        });
    });

    describe("constructSystemPrompt", () => {
        it("should return base prompt when no articles are provided", () => {
            const prompt = constructSystemPrompt([]);
            expect(prompt).toContain("NO SE ENCONTRARON REGISTROS");
        });
    });

    describe("convertToModelMessages", () => {
        it("should handle mixed parts correctly", () => {
            const messages: Array<{ id: string; role: string; content: string; parts: Array<{ type: string; text: string }> }> = [
                { id: "1", role: "user", content: "Hello", parts: [{ type: "text", text: "Hello" }, { type: "other", text: "skip" }] }
            ];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const modelMessages = convertToModelMessages(messages as any);
            expect(modelMessages[0].content).toHaveLength(1);
        });
    });
});
