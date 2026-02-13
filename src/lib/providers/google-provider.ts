import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { AIProvider } from "./ai-provider.interface";
import { LanguageModel, generateText } from "ai";

export class GoogleProvider implements AIProvider {
  name = "google";
  private readonly client;

  constructor() {
    this.client = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_KEY,
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
      console.error(`Health check failed for Google (${modelId}):`, error);
      return false;
    }
  }
}
