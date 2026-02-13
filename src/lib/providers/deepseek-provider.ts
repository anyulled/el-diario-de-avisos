import { createDeepSeek } from "@ai-sdk/deepseek";
import { AIProvider } from "./ai-provider.interface";
import { LanguageModel, generateText } from "ai";

export class DeepSeekProvider implements AIProvider {
  name = "deepseek";
  private readonly client;

  constructor() {
    this.client = createDeepSeek({
      apiKey: process.env.DEEPSEEK_API_KEY,
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
      console.error(`Health check failed for DeepSeek (${modelId}):`, error);
      return false;
    }
  }
}
