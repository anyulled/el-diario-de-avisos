import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    getPendingCounts,
    ingest,
    ingestArticles,
    ingestEntities,
    ingestEssays,
    runCli,
    runContinuousMode,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    IngestConfig,
} from "./ingest";

// Mock dependencies
vi.mock("../src/db", () => ({
    db: {
        select: vi.fn(),
        insert: vi.fn(),
    },
}));

vi.mock("../src/lib/ai", () => ({
    generateEmbeddingsBatch: vi.fn(),
}));

vi.mock("../src/lib/rtf-content-converter", () => ({
    processRtfContent: vi.fn(),
}));

vi.mock("drizzle-orm", () => ({
    eq: vi.fn((a: unknown, b: unknown) => ({ type: "eq", a, b })),
    isNull: vi.fn((col: unknown) => ({ type: "isNull", col })),
    sql: vi.fn((strings: unknown, ...values: unknown[]) => ({ type: "sql", strings, values })),
}));

vi.mock("../src/db/schema", () => ({
    articles: {
        id: "articles.id",
        title: "articles.title",
        content: "articles.content",
    },
    essays: {
        id: "essays.id",
        title: "essays.title",
        content: "essays.content",
    },
    articleEmbeddings: {
        articleId: "articleEmbeddings.articleId",
    },
    essayEmbeddings: {
        essayId: "essayEmbeddings.essayId",
    },
}));

// Import mocked modules
import { db } from "../src/db";
import { generateEmbeddingsBatch } from "../src/lib/ai";
import { processRtfContent } from "../src/lib/rtf-content-converter";


describe("scripts/ingest", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, "log").mockImplementation(() => {
            /* Noop */
        });
        vi.spyOn(console, "error").mockImplementation(() => {
            /* Noop */
        });
    });

    type MockCountResult = Array<{ count?: number }>;
    type MockEntityResult = Array<{ id: number; title: string; content: Buffer }>;

    const setupDbMock = (countResult: MockCountResult, entityResult?: MockEntityResult) => {
        const state = { callCount: 0 };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(db.select).mockImplementation((): any => {
            state.callCount++;
            const mockChain = {
                from: vi.fn().mockReturnThis(),
                leftJoin: vi.fn().mockReturnThis(),
                where: vi.fn(() => {
                    /* First call is for count query */
                    if (state.callCount === 1) {
                        return Promise.resolve(countResult);
                    }
                    /* Second call is for entity query (if provided) */
                    return mockChain;
                }),
                limit: vi.fn(() => Promise.resolve(entityResult ?? [])),
            };
            return mockChain;
        });
    };

    const setupInsertMock = () => {
        const mockChain = {
            values: vi.fn().mockReturnThis(),
            onConflictDoUpdate: vi.fn(() => Promise.resolve()),
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(db.insert).mockReturnValue(mockChain as any);
        return mockChain;
    };

    describe("getPendingCounts", () => {
        it("should return pending counts for articles and essays", async () => {
            const state = { callCount: 0 };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(db.select).mockImplementation((): any => {
                state.callCount++;
                const result = state.callCount === 1 ? [{ count: 5 }] : [{ count: 3 }];
                return {
                    from: vi.fn().mockReturnThis(),
                    leftJoin: vi.fn().mockReturnThis(),
                    where: vi.fn(() => Promise.resolve(result)),
                };
            });

            const result = await getPendingCounts();

            expect(result).toEqual({ articles: 5, essays: 3 });
        });

        it("should return 0 when no pending entities", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(db.select).mockImplementation((): any => ({
                from: vi.fn().mockReturnThis(),
                leftJoin: vi.fn().mockReturnThis(),
                where: vi.fn(() => Promise.resolve([{ count: 0 }])),
            }));

            const result = await getPendingCounts();

            expect(result).toEqual({ articles: 0, essays: 0 });
        });

        it("should handle undefined count gracefully", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(db.select).mockImplementation((): any => ({
                from: vi.fn().mockReturnThis(),
                leftJoin: vi.fn().mockReturnThis(),
                where: vi.fn(() => Promise.resolve([{}])),
            }));

            const result = await getPendingCounts();

            expect(result).toEqual({ articles: 0, essays: 0 });
        });
    });

    describe("ingestEntities", () => {
        const mockConfig = {
            entityName: "Articles",
            entityTable: { id: "articles.id", title: "articles.title", content: "articles.content" },
            embeddingTable: { articleId: "articleEmbeddings.articleId" },
            entityIdColumn: "articles.id" as unknown as Parameters<typeof import("drizzle-orm").eq>[0],
            embeddingIdColumn: "articleEmbeddings.articleId" as unknown as Parameters<typeof import("drizzle-orm").eq>[0],
            batchLimit: 500,
            embeddingBatchSize: 100,
        };

        it("should skip ingestion when all entities have embeddings", async () => {
            setupDbMock([{ count: 0 }]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await ingestEntities(mockConfig as any);

            expect(console.log).toHaveBeenCalledWith("✅ All articles already have embeddings.");
        });

        it("should process entities without embeddings successfully", async () => {
            setupDbMock(
                [{ count: 2 }],
                [
                    { id: 1, title: "Article 1", content: Buffer.from("Content 1") },
                    { id: 2, title: "Article 2", content: Buffer.from("Content 2") },
                ]
            );
            setupInsertMock();

            vi.mocked(processRtfContent).mockResolvedValue("Processed content");
            vi.mocked(generateEmbeddingsBatch).mockResolvedValue([
                new Array(1536).fill(0.1),
                new Array(1536).fill(0.2),
            ]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await ingestEntities(mockConfig as any);

            expect(vi.mocked(processRtfContent)).toHaveBeenCalledTimes(2);
            expect(vi.mocked(generateEmbeddingsBatch)).toHaveBeenCalledTimes(1);
            expect(vi.mocked(db.insert)).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Successfully ingested"));
        });

        it("should handle no valid content in batch", async () => {
            setupDbMock([{ count: 1 }], [{ id: 1, title: "Article 1", content: Buffer.from("") }]);

            vi.mocked(processRtfContent).mockResolvedValue("   ");

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await ingestEntities(mockConfig as any);

            expect(console.log).toHaveBeenCalledWith("⚠️ No valid content found in this batch.");
            expect(vi.mocked(generateEmbeddingsBatch)).not.toHaveBeenCalled();
        });

        it("should handle embedding generation errors gracefully", async () => {
            setupDbMock([{ count: 1 }], [{ id: 1, title: "Article 1", content: Buffer.from("Content") }]);

            vi.mocked(processRtfContent).mockResolvedValue("Valid content");
            vi.mocked(generateEmbeddingsBatch).mockRejectedValue(new Error("API Error"));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await ingestEntities(mockConfig as any);

            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining("Articles ingestion failed"),
                expect.any(Error)
            );
        });

        it("should process embeddings in sub-batches", async () => {
            const largeConfig = { ...mockConfig, embeddingBatchSize: 2 };

            setupDbMock(
                [{ count: 5 }],
                [
                    { id: 1, title: "A1", content: Buffer.from("C1") },
                    { id: 2, title: "A2", content: Buffer.from("C2") },
                    { id: 3, title: "A3", content: Buffer.from("C3") },
                    { id: 4, title: "A4", content: Buffer.from("C4") },
                    { id: 5, title: "A5", content: Buffer.from("C5") },
                ]
            );
            setupInsertMock();

            vi.mocked(processRtfContent).mockResolvedValue("Processed content");
            vi.mocked(generateEmbeddingsBatch).mockResolvedValue([
                new Array(1536).fill(0.1),
                new Array(1536).fill(0.2),
            ]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await ingestEntities(largeConfig as any);

            // Should be called 3 times: ceil(5/2) = 3
            expect(vi.mocked(generateEmbeddingsBatch)).toHaveBeenCalledTimes(3);
        });

        it("should use correct property name for essays", async () => {
            const essayConfig = {
                entityName: "Essays",
                entityTable: { id: "essays.id", title: "essays.title", content: "essays.content" },
                embeddingTable: { essayId: "essayEmbeddings.essayId" },
                entityIdColumn: "essays.id" as unknown as Parameters<typeof import("drizzle-orm").eq>[0],
                embeddingIdColumn: "essayEmbeddings.essayId" as unknown as Parameters<typeof import("drizzle-orm").eq>[0],
                batchLimit: 100,
                embeddingBatchSize: 100,
            };

            setupDbMock([{ count: 1 }], [{ id: 1, title: "Essay 1", content: Buffer.from("Content") }]);
            setupInsertMock();

            vi.mocked(processRtfContent).mockResolvedValue("Processed content");
            vi.mocked(generateEmbeddingsBatch).mockResolvedValue([new Array(1536).fill(0.1)]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await ingestEntities(essayConfig as any);

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining("property: essayId"));
        });

        it("should show remaining count when batch is incomplete", async () => {
            setupDbMock([{ count: 10 }], [{ id: 1, title: "Article 1", content: Buffer.from("Content") }]);
            setupInsertMock();

            vi.mocked(processRtfContent).mockResolvedValue("Processed content");
            vi.mocked(generateEmbeddingsBatch).mockResolvedValue([new Array(1536).fill(0.1)]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await ingestEntities(mockConfig as any);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining("Remaining articles without embeddings: 9")
            );
        });

        it("should show completion message when all entities processed", async () => {
            setupDbMock([{ count: 1 }], [{ id: 1, title: "Article 1", content: Buffer.from("Content") }]);
            setupInsertMock();

            vi.mocked(processRtfContent).mockResolvedValue("Processed content");
            vi.mocked(generateEmbeddingsBatch).mockResolvedValue([new Array(1536).fill(0.1)]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await ingestEntities(mockConfig as any);

            expect(console.log).toHaveBeenCalledWith(
                expect.stringContaining("All articles now have embeddings!")
            );
        });
    });

    describe("ingestArticles", () => {
        it("should call ingestEntities with correct article configuration", async () => {
            setupDbMock([{ count: 0 }]);

            await ingestArticles();

            expect(console.log).toHaveBeenCalledWith("🚀 Starting Articles Ingestion...");
        });
    });

    describe("ingestEssays", () => {
        it("should call ingestEntities with correct essay configuration", async () => {
            setupDbMock([{ count: 0 }]);

            await ingestEssays();

            expect(console.log).toHaveBeenCalledWith("🚀 Starting Essays Ingestion...");
        });
    });

    describe("ingest", () => {
        it("should call both ingestArticles and ingestEssays in sequence", async () => {
            setupDbMock([{ count: 0 }]);

            await ingest();

            expect(console.log).toHaveBeenCalledWith("🚀 Starting Articles Ingestion...");
            expect(console.log).toHaveBeenCalledWith("--------------------------------");
            expect(console.log).toHaveBeenCalledWith("🚀 Starting Essays Ingestion...");
        });
    });

    describe("runContinuousMode", () => {
        it("should run ingestion until all entities have embeddings", async () => {
            const state = { ingestCallCount: 0 };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(db.select).mockImplementation((): any => {
                state.ingestCallCount++;
                /*
                 * First ingest: articles=0, essays=0 (skip both)
                 * First getPendingCounts: articles=5, essays=3 (continue)
                 * Second ingest: articles=0, essays=0 (skip both)
                 * Second getPendingCounts: articles=0, essays=0 (exit)
                 */

                const results = [
                    [{ count: 0 }],
                    [{ count: 0 }],
                    [{ count: 5 }],
                    [{ count: 3 }],
                    [{ count: 0 }],
                    [{ count: 0 }],
                    [{ count: 0 }],
                    [{ count: 0 }],
                ];

                const result = results[state.ingestCallCount - 1] ?? [{ count: 0 }];

                return {
                    from: vi.fn().mockReturnThis(),
                    leftJoin: vi.fn().mockReturnThis(),
                    where: vi.fn(() => Promise.resolve(result)),
                };
            });

            await runContinuousMode();

            expect(console.log).toHaveBeenCalledWith("🔄 Running in continuous mode (--all)...");
            expect(console.log).toHaveBeenCalledWith("⏳ Continuing to next batch...");
            expect(console.log).toHaveBeenCalledWith("✨ All ingestion complete!");
        });

        it("should exit immediately if no pending entities", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(db.select).mockImplementation((): any => ({
                from: vi.fn().mockReturnThis(),
                leftJoin: vi.fn().mockReturnThis(),
                where: vi.fn(() => Promise.resolve([{ count: 0 }])),
            }));

            await runContinuousMode();

            expect(console.log).toHaveBeenCalledWith("✨ All ingestion complete!");
            expect(console.log).not.toHaveBeenCalledWith("⏳ Continuing to next batch...");
        });
    });

    describe("runCli", () => {
        it("should run normal mode when no --all flag", async () => {
            setupDbMock([{ count: 0 }]);

            await runCli([]);

            expect(console.log).toHaveBeenCalledWith("🚀 Starting Articles Ingestion...");
            expect(console.log).not.toHaveBeenCalledWith("🔄 Running in continuous mode (--all)...");
        });

        it("should run continuous mode when --all flag is present", async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            vi.mocked(db.select).mockImplementation((): any => ({
                from: vi.fn().mockReturnThis(),
                leftJoin: vi.fn().mockReturnThis(),
                where: vi.fn(() => Promise.resolve([{ count: 0 }])),
            }));

            await runCli(["--all"]);

            expect(console.log).toHaveBeenCalledWith("🔄 Running in continuous mode (--all)...");
        });

        it("should handle other arguments gracefully", async () => {
            setupDbMock([{ count: 0 }]);

            await runCli(["--verbose", "--debug"]);

            expect(console.log).toHaveBeenCalledWith("🚀 Starting Articles Ingestion...");
            expect(console.log).not.toHaveBeenCalledWith("🔄 Running in continuous mode (--all)...");
        });
    });
});
