/* eslint-disable */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ingestEntities } from "./ingest";
import { db } from "../src/db";
import { generateEmbeddingsBatch } from "../src/lib/ai";
import { processRtfContent } from "../src/lib/rtf-content-converter";

// We need to hoist the mock factory so it runs before imports
vi.mock("../src/db", () => {
  return {
    db: {
      select: vi.fn(),
      insert: vi.fn(),
    },
  };
});

vi.mock("../src/lib/ai", () => ({
  generateEmbeddingsBatch: vi.fn(),
}));

vi.mock("../src/lib/rtf-content-converter", () => ({
  processRtfContent: vi.fn(),
}));

describe("ingestEntities Performance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should verify database insert behavior", async () => {
    const pendingCount = 5;
    const mockDb = db as any;

    // Define chains
    const selectChain = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      then: vi.fn(),
    };

    const insertChain = {
      values: vi.fn().mockReturnThis(),
      onConflictDoUpdate: vi.fn().mockReturnThis(),
      then: vi.fn((resolve) => resolve([])),
    };

    mockDb.select.mockReturnValue(selectChain);
    mockDb.insert.mockReturnValue(insertChain);

    // Setup select return values
    const countResult = [{ count: pendingCount }];
    const entitiesResult = Array.from({ length: pendingCount }, (_, i) => ({
      id: i + 1,
      title: `Entity ${i + 1}`,
      content: Buffer.from("rtf content"),
    }));

    // Mock select responses
    selectChain.then
      .mockImplementationOnce((resolve: any) => resolve(countResult)) // First call: count
      .mockImplementationOnce((resolve: any) => resolve(entitiesResult)); // Second call: entities

    // Mock other helpers
    (processRtfContent as any).mockResolvedValue("processed content");
    (generateEmbeddingsBatch as any).mockResolvedValue(
      Array.from({ length: pendingCount }, () => Array(768).fill(0.1))
    );

    // Mock Config
    const config = {
      entityName: "TestEntity",
      entityTable: { title: {}, content: {} } as any,
      embeddingTable: {} as any,
      entityIdColumn: { name: "id" } as any,
      embeddingIdColumn: { name: "entityId" } as any,
      batchLimit: 10,
      embeddingBatchSize: 2,
    };

    // Run the function
    await ingestEntities(config);

    // Verify insert calls
    const insertCalls = mockDb.insert.mock.calls.length;
    console.log(`BENCHMARK_RESULT: db.insert was called ${insertCalls} times`);

    // Check values passed to insert
    if (insertCalls > 0) {
        // console.log("Insert args:", mockDb.insert.mock.calls);
    }
  });
});
/* eslint-enable */
