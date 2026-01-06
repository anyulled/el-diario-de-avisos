import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../src/db";

async function checkColumns() {
  console.log("📊 Checking column usage...\n");

  // Check subtitle usage
  const subtitleStats = await db.execute(sql`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE arti_subtitulo IS NOT NULL AND arti_subtitulo != '') as with_subtitle,
      COUNT(*) FILTER (WHERE arti_contenido IS NOT NULL) as with_content
    FROM articulos
  `);

  console.log("Column Statistics:");
  console.log(`Total articles: ${subtitleStats.rows[0].total}`);
  console.log(`With subtitle: ${subtitleStats.rows[0].with_subtitle}`);
  console.log(`With content: ${subtitleStats.rows[0].with_content}`);

  // Sample some subtitles
  const sampleSubtitles = await db.execute(sql`
    SELECT arti_titulo, arti_subtitulo 
    FROM articulos 
    WHERE arti_subtitulo IS NOT NULL AND arti_subtitulo != ''
    LIMIT 5
  `);

  console.log("\nSample articles with subtitles:");
  (sampleSubtitles.rows as Array<{ arti_titulo: string; arti_subtitulo: string }>).forEach((row) => {
    console.log(`- Title: ${row.arti_titulo}`);
    console.log(`  Subtitle: ${row.arti_subtitulo}\n`);
  });

  process.exit(0);
}

checkColumns();
