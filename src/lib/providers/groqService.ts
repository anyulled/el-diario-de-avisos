import { Groq } from "groq-sdk";
import { AIService, ChatMessage } from "../types";

const groq = new Groq({
  apiKey: process.env.GROQ_KEY,
});

export const groqService: AIService = {
  name: "Groq",
  async chat(messages: ChatMessage[]) {
    const chatCompletion = await groq.chat.completions.create({
      model: "moonshot/kimi-k2-instruct-0905",
      temperature: 0.7,
      max_completion_tokens: 4096,
      top_p: 1,
      stream: true,
      stop: null,
      messages,
    });

    return (async function* () {
      for await (const chunk of chatCompletion) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    })();
  },
};
