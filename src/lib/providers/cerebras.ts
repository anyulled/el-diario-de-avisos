import { Cerebras } from "@cerebras/cerebras_cloud_sdk";
import { AIService, ChatMessage } from "../types";

const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_KEY,
});

export const cerebrasService: AIService = {
  name: "Cerebras",
  async chat(messages: ChatMessage[]) {
    const chatCompletion = await cerebras.chat.completions.create({
      model: "zai-glm-4.6",
      temperature: 0.7,
      max_completion_tokens: 40960,
      top_p: 0.95,
      stream: true,
      stop: null,
      messages,
    });

    return (async function* () {
      for await (const chunk of chatCompletion) {
        const anyChunk = chunk as {
          choices?: Array<{
            delta?: { content?: string | null };
            message?: { content?: string | null };
          }>;
        };
        const content = anyChunk.choices?.[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    })();
  },
};
