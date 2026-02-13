import { createGroq } from "@ai-sdk/groq";
import { AIProvider } from "./ai-provider.interface";
import { LanguageModel, generateText } from "ai";

export class GroqProvider implements AIProvider {
  name = "groq";
  private readonly client;

  constructor() {
    this.client = createGroq({
      apiKey: process.env.GROQ_KEY,
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
      console.error(`Health check failed for Groq (${modelId}):`, error);
      return false;
    }
  }
}
