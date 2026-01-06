import "dotenv/config";
import { findSimilarArticles } from "../src/lib/vector-store";

async function testChatbotRetrieval() {
    const queries = [
        "necrologia",
        "jose anjel montero",  // Correct spelling
        "José ánjel Montero"   // Accented
    ];

    for (const query of queries) {
        console.log(`\n🤖 Testing Chatbot Retrieval for '${query}'...`);
        try {
            const results = await findSimilarArticles(query);

            console.log(`   Found ${results.length} results.`);
            let found = false;

            results.forEach((r, i) => {
                if (i < 3) console.log(`   ${i + 1}. [${r.id}] "${r.title}" (Sim: ${r.similarity})`);
                if (r.id === 3443) found = true;
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
