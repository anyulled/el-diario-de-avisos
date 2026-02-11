import { createOpenAI } from "@ai-sdk/openai";
import { AIProvider } from "./ai-provider.interface";
import { LanguageModel, generateText } from "ai";

export class CerebrasProvider implements AIProvider {
  name = "cerebras";
  private readonly client;

  constructor() {
    this.client = createOpenAI({
      apiKey: process.env.CEREBRAS_KEY,
      baseURL: "https://api.cerebras.ai/v1",
    });
  }

  createModel(modelId: string): LanguageModel {
    return this.client(modelId);
  }

  async checkHealth(modelId: string): Promise<boolean> {
    try {
      const model = this.createModel(modelId);
      await generateText({
        model,
        prompt: "health check",
      });
      return true;
    } catch (error) {
      console.error(`Health check failed for Cerebras (${modelId}):`, error);
      return false;
    }
  }
}
