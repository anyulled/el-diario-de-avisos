import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_KEY) {
  throw new Error("Missing GEMINI_KEY in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

export async function generateEmbedding(text: string): Promise<number[]> {
  const result = await model.embedContent({
    content: { role: "user", parts: [{ text }] },
  });
  return result.embedding.values;
}

export async function generateEmbeddingsBatch(
  texts: string[],
): Promise<number[][]> {
  const result = await model.batchEmbedContents({
    requests: texts.map((text) => ({
      content: { role: "user", parts: [{ text }] },
      model: "models/text-embedding-004",
    })),
  });
  return result.embeddings.map((e) => e.values);
}
