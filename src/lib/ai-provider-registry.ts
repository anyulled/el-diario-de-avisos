import { AIProvider } from "./providers/ai-provider.interface";
import { GroqProvider } from "./providers/groq-provider";
import { CerebrasProvider } from "./providers/cerebras-provider";
import { GoogleProvider } from "./providers/google-provider";
import { MoonshotProvider } from "./providers/moonshot-provider";
import { DeepSeekProvider } from "./providers/deepseek-provider";
import { OpenAIProvider } from "./providers/openai-provider";
import { LanguageModel } from "ai";

export interface ModelConfig {
  provider: string;
  modelId: string;
}

export class AIProviderRegistry {
  protected readonly providers: Map<string, AIProvider>;
  protected readonly fallbackChain: ModelConfig[];
  private readonly healthCache: Map<string, { healthy: boolean; timestamp: number }>;
  // 5 minutes
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  constructor() {
    this.providers = new Map();
    this.healthCache = new Map();
    this.initializeProviders();

    this.fallbackChain = [
      { provider: "groq", modelId: "llama-3.3-70b-versatile" },
      { provider: "groq", modelId: "llama-3.1-8b-instant" },
      { provider: "cerebras", modelId: "gpt-oss-120b" },
      { provider: "cerebras", modelId: "zai-glm-4.7" },
      { provider: "google", modelId: "gemini-1.5-flash" },
      { provider: "moonshot", modelId: "kimi-k2.5" },
      { provider: "deepseek", modelId: "deepseek-chat" },
      { provider: "openai", modelId: "gpt-4o-mini" },
    ];
  }

  private initializeProviders() {
    this.addProvider(new GroqProvider());
    this.addProvider(new CerebrasProvider());
    this.addProvider(new GoogleProvider());
    this.addProvider(new MoonshotProvider());
    this.addProvider(new DeepSeekProvider());
    this.addProvider(new OpenAIProvider());
  }

  private addProvider(provider: AIProvider) {
    this.providers.set(provider.name, provider);
  }

  getFallbackChain(): ModelConfig[] {
    return this.fallbackChain;
  }

  getModel(providerName: string, modelId: string): LanguageModel {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }
    return provider.createModel(modelId);
  }

  async getWorkingModel(): Promise<{ model: LanguageModel; config: ModelConfig }> {
    for (const config of this.fallbackChain) {
      const cacheKey = `${config.provider}:${config.modelId}`;
      const cached = this.healthCache.get(cacheKey);
      const now = Date.now();

      if (cached && now - cached.timestamp < this.CACHE_DURATION && cached.healthy) {
        return {
          model: this.getModel(config.provider, config.modelId),
          config,
        };
      }

      const provider = this.providers.get(config.provider);
      if (provider) {
        const isHealthy = await provider.checkHealth(config.modelId);
        this.healthCache.set(cacheKey, { healthy: isHealthy, timestamp: now });

        if (isHealthy) {
          return {
            model: this.getModel(config.provider, config.modelId),
            config,
          };
        }
      }
    }

    // If all fail, return the first one as a last resort
    const firstConfig = this.fallbackChain[0];
    return {
      model: this.getModel(firstConfig.provider, firstConfig.modelId),
      config: firstConfig,
    };
  }
}

export const aiProviderRegistry = new AIProviderRegistry();
