/**
 * Transform Dates for "La Opinión Nacional"
 *
 * This script updates the 'arti_fecha' column for articles belonging to
 * "La Opinión Nacional" using the 'extract_article_date' SQL function.
 *
 * Usage:
 *   npx tsx scripts/transform-la-opinion-nacional-dates.ts [--dry-run]
 */

import * as dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config({ path: ".env.local" });

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("📅 Transforming Dates for 'La Opinión Nacional'...");

    // 1. Get Publication ID
    const pubRes = await pool.query("SELECT pub_cod FROM publicaciones WHERE pub_nombre = 'La Opinión Nacional'");
    if (pubRes.rows.length === 0) {
      console.error("❌ Publication 'La Opinión Nacional' not found. Run the import migration first.");
      process.exit(1);
    }
    const pubId = pubRes.rows[0].pub_cod;
    console.log(`✓ Found Publication ID: ${pubId}`);

    // 2. Count target articles
    const countRes = await pool.query("SELECT COUNT(*) as count FROM articulos WHERE pub_cod = $1", [pubId]);
    const total = parseInt(countRes.rows[0].count);
    console.log(`✓ Found ${total} articles to process.`);

    if (total === 0) {
      console.log("Nothing to do.");
      return;
    }

    if (isDryRun) {
      console.log("🔍 DRY RUN: Previewing date extraction...");
      const previewRes = await pool.query(
        `
        SELECT 
          arti_cod as id,
          extract_article_date(arti_contenido) as extracted_date,
          substring(convert_from(decode(replace(encode(arti_contenido, 'hex'), '00', ''), 'hex'), 'WIN1252'), 1, 100) as preview
        FROM articulos 
        WHERE pub_cod = $1
        LIMIT 10
      `,
        [pubId],
      );

      console.log("\nSample Extraction:");
      previewRes.rows.forEach((row) => {
        console.log(`ID ${row.id}: ${row.extracted_date ? row.extracted_date.toISOString().split("T")[0] : "NULL"} | "${row.preview.replace(/\n/g, " ")}..."`);
      });
    } else {
      console.log("🚀 Applying extraction...");
      const updateRes = await pool.query(
        `
        UPDATE articulos 
        SET arti_fecha = extract_article_date(arti_contenido)
        WHERE pub_cod = $1
      `,
        [pubId],
      );
      console.log(`✓ Updated ${updateRes.rowCount} articles.`);
    }

    // 3. Verification Stats
    const statsRes = await pool.query(
      `
      SELECT 
        COUNT(*) FILTER (WHERE arti_fecha IS NOT NULL) as valid,
        COUNT(*) FILTER (WHERE arti_fecha IS NULL) as nulls
      FROM articulos 
      WHERE pub_cod = $1
    `,
      [pubId],
    );

    const valid = parseInt(statsRes.rows[0].valid);
    const nulls = parseInt(statsRes.rows[0].nulls);
    const rate = (valid / total) * 100;

    console.log("\nstats:");
    console.log(`  Valid Dates: ${valid}`);
    console.log(`  Null Dates:  ${nulls}`);
    console.log(`  Success Rate: ${rate.toFixed(2)}%`);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);
