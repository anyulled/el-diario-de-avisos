/**
 * Date Transformation Script
 *
 * This script performs the date transformation for the Articulos table:
 * 1. Adds the arti_fecha_timestamp column
 * 2. Extracts dates from arti_contenido and populates arti_fecha_timestamp
 * 3. Verifies the transformation
 * 4. Optionally performs the column rename
 *
 * Usage:
 *   npx tsx scripts/transform-dates.ts [--dry-run] [--rename]
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { Pool } from "pg";

dotenv.config({ path: ".env.local" });

interface TransformResult {
  totalArticles: number;
  articlesWithExtractedDate: number;
  articlesWithoutDate: number;
  sampleDates: { id: number; oldDate: string; newDate: string | null; contentPreview: string }[];
}

async function runMigration(pool: Pool): Promise<void> {
  const migrationPath = path.join(__dirname, "../drizzle/migrations/add_fecha_timestamp.sql");
  const sql = fs.readFileSync(migrationPath, "utf8");

  console.log("Running date transformation migration...");

  // Execute the entire SQL file as one statement - necessary for PL/pgSQL functions
  try {
    await pool.query(sql);
    console.log("✓ Migration executed successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Check if it's an "already exists" error
    if (errorMessage.includes("already exists")) {
      console.log("⊙ Skipped: Column or function already exists");
    } else {
      console.error("✗ Migration failed:", errorMessage);
      throw error;
    }
  }
}
async function verifyTransformation(pool: Pool): Promise<TransformResult> {
  console.log("\n📊 Verifying transformation...\n");

  // Check if arti_fecha_timestamp column exists
  const columnCheck = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'articulos' AND column_name = 'arti_fecha_timestamp'
  `);

  if (columnCheck.rows.length === 0) {
    console.log("⚠️  Column arti_fecha_timestamp does not exist yet.");
    console.log("   Run without --dry-run to create the column and extract dates.\n");
    return {
      totalArticles: 0,
      articlesWithExtractedDate: 0,
      articlesWithoutDate: 0,
      sampleDates: [],
    };
  }

  // Get total count
  const totalResult = await pool.query("SELECT COUNT(*) as count FROM articulos");
  const totalArticles = parseInt(totalResult.rows[0].count);

  // Get count with extracted dates
  const extractedResult = await pool.query(`
    SELECT COUNT(*) as count 
    FROM articulos 
    WHERE arti_fecha_timestamp IS NOT NULL
  `);
  const articlesWithExtractedDate = parseInt(extractedResult.rows[0].count);

  // Get count without dates
  const noDateResult = await pool.query(`
    SELECT COUNT(*) as count 
    FROM articulos 
    WHERE arti_fecha_timestamp IS NULL
  `);
  const articlesWithoutDate = parseInt(noDateResult.rows[0].count);

  // Get sample dates for verification
  const sampleResult = await pool.query(`
    SELECT 
      arti_cod as id,
      arti_fecha as old_date,
      arti_fecha_timestamp as new_date,
      substring(convert_from(decode(replace(encode(arti_contenido, 'hex'), '00', ''), 'hex'), 'WIN1252'), 1, 150) as content_preview
    FROM articulos
    WHERE arti_fecha_timestamp IS NOT NULL
    ORDER BY arti_fecha_timestamp DESC
    LIMIT 10
  `);

  const sampleDates = sampleResult.rows.map((row) => ({
    id: row.id,
    oldDate: row.old_date,
    newDate: row.new_date ? new Date(row.new_date).toISOString().split("T")[0] : null,
    contentPreview: row.content_preview?.substring(0, 100) || "",
  }));

  return {
    totalArticles,
    articlesWithExtractedDate,
    articlesWithoutDate,
    sampleDates,
  };
}

async function printResults(result: TransformResult): Promise<void> {
  console.log("═".repeat(60));
  console.log("Date Transformation Results");
  console.log("═".repeat(60));
  console.log(`Total articles:                ${result.totalArticles.toLocaleString()}`);
  console.log(`Articles with extracted date:  ${result.articlesWithExtractedDate.toLocaleString()}`);
  console.log(`Articles without date:         ${result.articlesWithoutDate.toLocaleString()}`);
  console.log(`Success rate:                  ${((result.articlesWithExtractedDate / result.totalArticles) * 100).toFixed(2)}%`);
  console.log("─".repeat(60));
  console.log("\nSample extracted dates:\n");

  for (const sample of result.sampleDates) {
    console.log(`  ID ${sample.id}:`);
    console.log(`    Old: "${sample.oldDate}" → New: "${sample.newDate}"`);
    console.log(`    Content: "${sample.contentPreview.replace(/[\n\r]/g, " ")}..."`);
    console.log();
  }
}

async function renameColumns(pool: Pool): Promise<void> {
  console.log("\n🔄 Renaming columns...\n");

  // Start transaction
  await pool.query("BEGIN");

  try {
    // Check if arti_fecha_old already exists
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'articulos' AND column_name = 'arti_fecha_old'
    `);

    if (checkResult.rows.length > 0) {
      console.log("⊙ Columns already renamed (arti_fecha_old exists)");
      await pool.query("ROLLBACK");
      return;
    }

    // Rename arti_fecha to arti_fecha_old
    await pool.query(`ALTER TABLE articulos RENAME COLUMN arti_fecha TO arti_fecha_old`);
    console.log("✓ Renamed arti_fecha → arti_fecha_old");

    // Rename arti_fecha_timestamp to arti_fecha
    await pool.query(`ALTER TABLE articulos RENAME COLUMN arti_fecha_timestamp TO arti_fecha`);
    console.log("✓ Renamed arti_fecha_timestamp → arti_fecha");

    // Commit transaction
    await pool.query("COMMIT");
    console.log("\n✓ Column rename completed successfully!");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const shouldRename = args.includes("--rename");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  console.log("📅 Date Transformation Script");
  console.log("─".repeat(60));
  if (isDryRun) console.log("🔍 DRY RUN MODE - No changes will be made\n");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    if (!isDryRun) {
      await runMigration(pool);
    }

    const result = await verifyTransformation(pool);
    await printResults(result);

    // If transformation is successful and --rename flag is passed
    if (shouldRename && !isDryRun) {
      const successRate = (result.articlesWithExtractedDate / result.totalArticles) * 100;

      if (successRate < 80) {
        console.log(`\n⚠️  Warning: Success rate (${successRate.toFixed(2)}%) is below 80%.`);
        console.log("    Consider investigating articles without dates before renaming.");
        console.log("    Use --rename flag with caution.\n");
      }

      await renameColumns(pool);
    } else if (shouldRename && isDryRun) {
      console.log("\n📝 DRY RUN: Would rename columns:");
      console.log("   arti_fecha → arti_fecha_old");
      console.log("   arti_fecha_timestamp → arti_fecha");
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("\n❌ Script failed:", err);
  process.exit(1);
});
