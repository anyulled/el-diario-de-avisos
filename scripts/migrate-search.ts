import "dotenv/config";
import { Client } from "pg";

async function runMigration() {
  console.log("🚀 Re-running migration with fixed RTF accent handling...\n");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Step 1: Update RTF stripping function with hex conversion and error handling
    console.log("1. Updating RTF stripping function with accent conversion...");
    await client.query(`
      CREATE OR REPLACE FUNCTION strip_rtf_content(content bytea) RETURNS text AS $func$
      DECLARE
        decoded_text text;
        cleaned_text text;
      BEGIN
        IF content IS NULL THEN
          RETURN '';
        END IF;
        
        -- Try to decode, return empty on error (null bytes, etc.)
        BEGIN
          decoded_text := convert_from(content, 'WIN1252');
        EXCEPTION WHEN OTHERS THEN
          RETURN '';
        END;
        
        IF decoded_text ~ '^\\s*\\{\\\\rtf' THEN
          -- Convert RTF hex sequences to actual characters using REPLACE
          cleaned_text := decoded_text;
          
          -- Lowercase accented vowels
          cleaned_text := REPLACE(cleaned_text, E'\\\\'||'e1', 'á');
          cleaned_text := REPLACE(cleaned_text, E'\\\\'||'e9', 'é');
          cleaned_text := REPLACE(cleaned_text, E'\\\\'||'ed', 'í');
          cleaned_text := REPLACE(cleaned_text, E'\\\\'||'f3', 'ó');
          cleaned_text := REPLACE(cleaned_text, E'\\\\'||'fa', 'ú');
          cleaned_text := REPLACE(cleaned_text, E'\\\\'||'fc', 'ü');
          
          -- Uppercase accented vowels
          cleaned_text := REPLACE(cleaned_text, E'\\\\'||'c1', 'Á');
          cleaned_text := REPLACE(cleaned_text, E'\\\\'||'c9', 'É');
          cleaned_text := REPLACE(cleaned_text, E'\\\\'||'cd', 'Í');
          cleaned_text := REPLACE(cleaned_text, E'\\\\'||'d3', 'Ó');
          cleaned_text := REPLACE(cleaned_text, E'\\\\'||'da', 'Ú');
          cleaned_text := REPLACE(cleaned_text, E'\\\\'||'dc', 'Ü');
          
          -- Ñ and ñ
          cleaned_text := REPLACE(cleaned_text, E'\\\\'||'f1', 'ñ');
          cleaned_text := REPLACE(cleaned_text, E'\\\\'||'d1', 'Ñ');
          
          -- Common punctuation
          cleaned_text := REPLACE(cleaned_text, E'\\\\'||'bf', '¿');
          cleaned_text := REPLACE(cleaned_text, E'\\\\'||'a1', '¡');
          
          -- Strip RTF control words
          cleaned_text := regexp_replace(cleaned_text, '\\\\[a-z]+(-?[0-9]+)?', '', 'g');
          
          -- Remove any remaining hex sequences
          cleaned_text := regexp_replace(cleaned_text, E'\\\\''[0-9a-f][0-9a-f]', '', 'gi');
          
          -- Remove curly braces and backslashes
          cleaned_text := regexp_replace(cleaned_text, '[{}\\\\]', '', 'g');
          
          -- Normalize whitespace
          cleaned_text := regexp_replace(cleaned_text, '\\s+', ' ', 'g');
          cleaned_text := trim(cleaned_text);
        ELSE
          cleaned_text := regexp_replace(decoded_text, '\\s+', ' ', 'g');
          cleaned_text := trim(cleaned_text);
        END IF;
        
        RETURN cleaned_text;
      END;
      $func$ LANGUAGE plpgsql IMMUTABLE
    `);

    // Step 2: Regenerate all search vectors
    console.log("2. Regenerating search vectors for all articles...");
    console.log("   This will take a moment to process ~10K articles...");

    const startTime = Date.now();
    await client.query(`
      UPDATE articulos SET search_vector = 
        setweight(to_tsvector('spanish', coalesce(arti_titulo, '')), 'A') ||
        setweight(to_tsvector('spanish', strip_rtf_content(arti_contenido)), 'C')
    `);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`   ✅ Completed in ${duration}s`);

    console.log("\n✅ Migration completed successfully!");
    console.log("📊 Verifying results...\n");

    // Test the specific case
    console.log("🧪 Testing search for 'José ánjel Montero'...");
    const testQueries = [
      "ánjel",
      "anjel",
      "Montero",
      "José"
    ];

    for (const query of testQueries) {
      const result = await client.query(
        "SELECT COUNT(*) as count FROM articulos WHERE search_vector @@ to_tsquery('spanish', $1)",
        [query]
      );
      console.log(`   "${query}": ${result.rows[0].count} results`);
    }

    // Verify article 3443 content
    console.log("\n📄 Checking article 3443...");
    const article = await client.query(`
      SELECT 
        arti_titulo as title,
        substring(strip_rtf_content(arti_contenido), 1, 300) as content_preview
      FROM articulos
      WHERE arti_cod = 3443
    `);

    if (article.rows.length > 0) {
      console.log(`   Title: "${article.rows[0].title}"`);
      console.log(`   Content: "${article.rows[0].content_preview}..."`);
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    await client.end();
    process.exit(1);
  }
}

runMigration();
