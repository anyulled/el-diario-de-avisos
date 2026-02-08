import { GoogleGenerativeAI } from "@google/generative-ai";

const getModel = () => {
  if (!process.env.GEMINI_KEY) {
    throw new Error("Missing GEMINI_KEY in environment variables");
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
  return genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });
};

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = getModel();
  const result = await model.embedContent({
    content: { role: "user", parts: [{ text }] },
  });
  return result.embedding.values;
}

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  const model = getModel();
  const result = await model.batchEmbedContents({
    requests: texts.map((text) => ({
      content: { role: "user", parts: [{ text }] },
      model: "models/gemini-embedding-001",
    })),
  });
  return result.embeddings.map((e) => e.values);
}
