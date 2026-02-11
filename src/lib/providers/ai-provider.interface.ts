import { LanguageModel } from "ai";

export interface AIProvider {
  name: string;
  createModel(modelId: string): LanguageModel;
  checkHealth(modelId: string): Promise<boolean>;
}
