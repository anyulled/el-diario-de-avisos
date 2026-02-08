import "dotenv/config";
import { generateEmbedding } from "../src/lib/ai";

async function verify() {
  console.log("🔍 Verifying embedding generation with models/gemini-embedding-001...");
  try {
    const text = "Hello world";
    const embedding = await generateEmbedding(text);

    if (embedding && embedding.length === 3072) {
      console.log("✅ Success! Generated embedding with 3072 dimensions.");
    } else {
      console.error(`❌ Failed! Expected 3072 dimensions, got ${embedding?.length}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error generating embedding:", error);
    process.exit(1);
  }
}

verify();
