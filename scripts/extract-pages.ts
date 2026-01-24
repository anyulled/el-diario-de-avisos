/**
 * Page Extraction Migration Script
 *
 * This script extracts page references from article content and updates the arti_pag column.
 * Supports patterns: (p.4), (P. 3), (P. 3 y 4), (P. 3, 4 y 5)
 *
 * Usage:
 *   npx tsx scripts/extract-pages.ts [--dry-run]
 */

import * as dotenv from "dotenv";
import { Pool } from "pg";
import { extractPageReference } from "../src/lib/page-extractor";

dotenv.config({ path: ".env.local" });

interface ExtractionResult {
  totalArticles: number;
  articlesWithExtractedPage: number;
  articlesWithoutPage: number;
  sampleExtractions: {
    id: number;
    title: string;
    oldPage: string | null;
    newPage: string | null;
    pattern?: string;
  }[];
}

async function extractPages(pool: Pool, dryRun: boolean): Promise<ExtractionResult> {
  console.log(`\n📄 ${dryRun ? "Analyzing" : "Extracting"} page references...\n`);

  // Get all articles with content
  const articlesResult = await pool.query(`
    SELECT arti_cod, arti_titulo, arti_pag, arti_contenido
    FROM articulos
    ORDER BY arti_cod
  `);

  const totalArticles = articlesResult.rows.length;
  const extractedPages: { id: number; pages: string }[] = [];
  const sampleExtractions: ExtractionResult["sampleExtractions"] = [];

  for (const row of articlesResult.rows) {
    const { arti_cod: id, arti_titulo: title, arti_pag: oldPage, arti_contenido: content } = row;

    // Extract page reference from content
    const result = extractPageReference(content);

    if (result.matched && result.pages) {
      extractedPages.push({ id, pages: result.pages });

      // Collect samples (first 10)
      if (sampleExtractions.length < 10) {
        sampleExtractions.push({
          id,
          title: title || "Sin título",
          oldPage,
          newPage: result.pages,
          pattern: result.pattern,
        });
      }
    }
  }

  // Apply updates if not dry run
  if (!dryRun && extractedPages.length > 0) {
    console.log(`\n💾 Updating ${extractedPages.length} articles...\n`);

    await pool.query("BEGIN");
    try {
      for (const { id, pages } of extractedPages) {
        await pool.query("UPDATE articulos SET arti_pag = $1 WHERE arti_cod = $2", [pages, id]);
      }
      await pool.query("COMMIT");
      console.log("✓ Updates committed successfully\n");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }

  return {
    totalArticles,
    articlesWithExtractedPage: extractedPages.length,
    articlesWithoutPage: totalArticles - extractedPages.length,
    sampleExtractions,
  };
}

async function printResults(result: ExtractionResult, dryRun: boolean): Promise<void> {
  console.log("═".repeat(70));
  console.log("Page Extraction Results");
  console.log("═".repeat(70));
  console.log(`Total articles:                ${result.totalArticles.toLocaleString()}`);
  console.log(`Articles with extracted page:  ${result.articlesWithExtractedPage.toLocaleString()}`);
  console.log(`Articles without page:         ${result.articlesWithoutPage.toLocaleString()}`);
  console.log(`Success rate:                  ${((result.articlesWithExtractedPage / result.totalArticles) * 100).toFixed(2)}%`);
  console.log("─".repeat(70));
  console.log("\nSample extractions:\n");

  for (const sample of result.sampleExtractions) {
    console.log(`  ID ${sample.id}: ${sample.title.substring(0, 50)}${sample.title.length > 50 ? "..." : ""}`);
    console.log(`    Old: ${sample.oldPage || "NULL"} → New: "${sample.newPage}" (${sample.pattern})`);
    console.log();
  }

  if (dryRun) {
    console.log("═".repeat(70));
    console.log("🔍 DRY RUN MODE - No changes were made");
    console.log("   Run without --dry-run to apply updates");
    console.log("═".repeat(70));
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  console.log("📄 Page Extraction Script");
  console.log("─".repeat(70));
  if (isDryRun) console.log("🔍 DRY RUN MODE - No changes will be made\n");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const result = await extractPages(pool, isDryRun);
    await printResults(result, isDryRun);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("\n❌ Script failed:", err);
  process.exit(1);
});
