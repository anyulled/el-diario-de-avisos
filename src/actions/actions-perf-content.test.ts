import { describe, it, expect, vi, afterEach } from "vitest";
import { getArticlesOnThisDay } from "./actions";
import { db } from "@/db";

// Mock setup
vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("next/cache", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  unstable_cache: (fn: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return fn;
  },
}));

vi.mock("@/lib/rtf-content-converter", () => ({
  processRtfContent: vi.fn().mockResolvedValue("extract"),
  stripHtml: vi.fn((html: string) => html),
}));

interface MockChain {
  from: ReturnType<typeof vi.fn>;
  leftJoin: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  then: (resolve: (value: unknown) => void) => Promise<void>;
  catch: ReturnType<typeof vi.fn>;
  finally: ReturnType<typeof vi.fn>;
  $dynamic: ReturnType<typeof vi.fn>;
  [key: string]: unknown;
}

// Mock chain
const createMockChain = (): MockChain => {
  const chain: Partial<MockChain> = {};
  const methods = ["from", "leftJoin", "where", "limit", "orderBy", "catch", "finally", "$dynamic"];
  methods.forEach((method) => {
    chain[method] = vi.fn().mockReturnValue(chain);
  });
  // Mocking then to resolve
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chain.then = (resolve: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    resolve([{ id: 1, title: "Test Article", content: Buffer.from("content"), plainText: "text" }]);
    return Promise.resolve();
  };
  return chain as MockChain;
};

describe("getArticlesOnThisDay Content Optimization", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should select content conditionally", async () => {
    const mockSelect = db.select as unknown as ReturnType<typeof vi.fn>;
    mockSelect.mockReturnValue(createMockChain());

    await getArticlesOnThisDay(1, 1);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const callArgs = mockSelect.mock.calls[0][0];

    expect(callArgs).toBeDefined();

    // Optimization: content should now be a SQL object (conditional selection), not a plain column reference.
    expect(callArgs).toHaveProperty("content");
    // Drizzle SQL objects created with sql`` template tag contain queryChunks
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(callArgs.content).toHaveProperty("queryChunks");
  });
});
