import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../src/db";

async function testContentSearch() {
  console.log("🔍 Testing content-based search...\n");

  // Test 1: Search for a word that likely appears in content but not titles
  console.log("Test 1: Searching for 'gobierno' (government)...");
  const test1 = await db.execute(sql`
    SELECT 
      arti_titulo as title,
      ts_rank(search_vector, to_tsquery('spanish_unaccent', 'gobierno')) as rank
    FROM articulos
    WHERE search_vector @@ to_tsquery('spanish_unaccent', 'gobierno')
    ORDER BY rank DESC
    LIMIT 5
  `);


  console.log(`  Found ${test1.rows.length} results:`);
  test1.rows.forEach((row: any, i: number) => {
    console.log(`  ${i + 1}. "${row.title}" (rank: ${row.rank})`);
  });

  // Test 2: Search for a common word
  console.log("\nTest 2: Searching for 'teatro' (theater)...");
  const test2 = await db.execute(sql`
    SELECT 
      arti_titulo as title,
      ts_rank(search_vector, to_tsquery('spanish_unaccent', 'teatro')) as rank
    FROM articulos
    WHERE search_vector @@ to_tsquery('spanish_unaccent', 'teatro')
    ORDER BY rank DESC
    LIMIT 5
  `);

  console.log(`  Found ${test2.rows.length} results:`);
  test2.rows.forEach((row: any, i: number) => {
    console.log(`  ${i + 1}. "${row.title}" (rank: ${row.rank})`);
  });

  // Test 3: Check search vector stats
  console.log("\nTest 3: Search vector statistics...");
  const stats = await db.execute(sql`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE search_vector IS NOT NULL) as with_vector,
      AVG(length(search_vector::text)) as avg_vector_length
    FROM articulos
  `);

  console.log(`  Total articles: ${stats.rows[0].total}`);
  console.log(`  With search vector: ${stats.rows[0].with_vector}`);
  console.log(`  Avg vector length: ${Math.round(stats.rows[0].avg_vector_length)} chars`);

  // Test 4: Sample a cleaned content
  console.log("\nTest 4: Sample cleaned content...");
  const sample = await db.execute(sql`
    SELECT 
      arti_titulo as title,
      substring(strip_rtf_content(arti_contenido), 1, 200) as cleaned_preview
    FROM articulos
    WHERE arti_contenido IS NOT NULL
      AND length(arti_contenido) > 100
    LIMIT 1
  `);

  if (sample.rows.length > 0) {
    console.log(`  Title: "${sample.rows[0].title}"`);
    console.log(`  Content preview: "${sample.rows[0].cleaned_preview}..."`);
  }

  console.log("\n✅ Content search testing complete!");
  process.exit(0);
}

testContentSearch();
