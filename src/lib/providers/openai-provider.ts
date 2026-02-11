import { createOpenAI } from "@ai-sdk/openai";
import { AIProvider } from "./ai-provider.interface";
import { LanguageModel, generateText } from "ai";

export class OpenAIProvider implements AIProvider {
  name = "openai";
  private readonly client;

  constructor() {
    this.client = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
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
      console.error(`Health check failed for OpenAI (${modelId}):`, error);
      return false;
    }
  }
}
