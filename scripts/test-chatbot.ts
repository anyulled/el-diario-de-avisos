import "dotenv/config";
import { findSimilarArticles } from "../src/lib/vector-store";

async function testChatbotRetrieval() {
  const queries = [
    "necrologia",
    // Correct spelling
    "jose anjel montero",
    // Accented
    "José ánjel Montero",
  ];

  for (const query of queries) {
    console.log(`\n🤖 Testing Chatbot Retrieval for '${query}'...`);
    try {
      const results = await findSimilarArticles(query);

      console.log(`   Found ${results.length} results.`);
      const found = results.some((r) => r.id === 3443);

      results.forEach((r, i) => {
        if (i < 3) console.log(`   ${i + 1}. [${r.id}] "${r.title}" (Sim: ${r.similarity})`);
      });

      if (found) {
        console.log("   ✅ Article 3443 found!");
      } else {
        console.log("   ❌ Article 3443 NOT found.");
      }
    } catch (error) {
      console.error(`   Error testing '${query}':`, error);
    }
  }
}

testChatbotRetrieval();
