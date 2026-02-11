import { describe, it, expect, vi } from "vitest";
import { AIProviderRegistry } from "./ai-provider-registry";

vi.mock("@ai-sdk/groq", () => ({ createGroq: vi.fn(() => vi.fn(() => ({}))) }));
vi.mock("@ai-sdk/openai", () => ({ createOpenAI: vi.fn(() => vi.fn(() => ({}))) }));
vi.mock("@ai-sdk/google", () => ({ createGoogleGenerativeAI: vi.fn(() => vi.fn(() => ({}))) }));
vi.mock("@ai-sdk/moonshotai", () => ({ createMoonshotAI: vi.fn(() => vi.fn(() => ({}))) }));
vi.mock("@ai-sdk/deepseek", () => ({ createDeepSeek: vi.fn(() => vi.fn(() => ({}))) }));

describe("AIProviderRegistry", () => {
  const createService = () => new AIProviderRegistry();

  it("should initialize with the correct fallback chain order", () => {
    const service = createService();
    const chain = service.getFallbackChain();
    expect(chain[0].provider).toBe("groq");
    expect(chain[1].provider).toBe("groq");
    expect(chain[2].provider).toBe("cerebras");
    expect(chain[chain.length - 1].provider).toBe("openai");
  });

  it("should return a model for a valid provider", () => {
    const service = createService();
    const model = service.getModel("groq", "llama-3.3-70b-versatile");
    expect(model).toBeDefined();
  });

  it("should throw an error for an invalid provider", () => {
    const service = createService();
    expect(() => service.getModel("invalid-provider", "model")).toThrow("Provider invalid-provider not found");
  });

  it("should return the first healthy model from the fallback chain", async () => {
    const service = createService();
    // Mock checkHealth for the first provider to be true

    const groqProvider = service["providers"].get("groq");
    if (!groqProvider) throw new Error("Groq provider not found");
    vi.spyOn(groqProvider, "checkHealth").mockResolvedValue(true);

    const result = await service.getWorkingModel();
    expect(result.config.provider).toBe("groq");
    expect(result.config.modelId).toBe("llama-3.3-70b-versatile");
  });

  it("should fall back to the next model if the first one is unhealthy", async () => {
    const service = createService();
    // Mock checkHealth for the first provider to be false

    const groqProvider = service["providers"].get("groq");

    const cerebrasProvider = service["providers"].get("cerebras");

    if (!groqProvider || !cerebrasProvider) throw new Error("Providers not found");

    vi.spyOn(groqProvider, "checkHealth").mockResolvedValue(false);
    vi.spyOn(cerebrasProvider, "checkHealth").mockResolvedValue(true);

    const result = await service.getWorkingModel();
    /*
     * Index 0: groq (unhealthy)
     * Index 1: groq (unhealthy)
     * Index 2: cerebras (healthy)
     */
    expect(result.config.provider).toBe("cerebras");
  });

  it("should use the cache for health checks", async () => {
    const service = createService();

    const groqProvider = service["providers"].get("groq");
    if (!groqProvider) throw new Error("Groq provider not found");
    const checkHealthSpy = vi.spyOn(groqProvider, "checkHealth").mockResolvedValue(true);

    await service.getWorkingModel();
    await service.getWorkingModel();

    expect(checkHealthSpy).toHaveBeenCalledTimes(1);
  });
});
