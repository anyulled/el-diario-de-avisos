import { createMoonshotAI } from "@ai-sdk/moonshotai";
import { AIProvider } from "./ai-provider.interface";
import { LanguageModel, generateText } from "ai";

export class MoonshotProvider implements AIProvider {
  name = "moonshot";
  private readonly client;

  constructor() {
    this.client = createMoonshotAI({
      apiKey: process.env.MOONSHOT_API_KEY,
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
      console.error(`Health check failed for Moonshot (${modelId}):`, error);
      return false;
    }
  }
}
