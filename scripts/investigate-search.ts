import "dotenv/config";
import { Client } from "pg";

async function investigateSearch() {
    console.log("🔍 Investigating search for 'necrología'...\n");

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    await client.connect();

    try {
        // Check article 3443
        console.log("1. Checking article 3443...");
        const article = await client.query(`
      SELECT 
        arti_cod,
        arti_titulo as title,
        substring(strip_rtf_content(arti_contenido), 1, 500) as content_preview
      FROM articulos
      WHERE arti_cod = 3443
    `);

        if (article.rows.length > 0) {
            const row = article.rows[0];
            console.log(`   Title: "${row.title}"`);
            console.log(`   Content preview: "${row.content_preview}"`);
        } else {
            console.log("   Article 3443 not found!");
        }

        // Test various search queries
        console.log("\n2. Testing search queries...");

        const queries = [
            "necrología",
            "necrologia",
            "Necrología",
            "NECROLOGÍA",
            "necro",
            "jose anjel"
        ];

        for (const query of queries) {
            // Testing with plain to_tsquery
            try {
                const result = await client.query(
                    "SELECT COUNT(*) as count FROM articulos WHERE search_vector @@ to_tsquery('spanish_unaccent', $1)",
                    [query]
                );
                console.log(`   "${query}" (plain): ${result.rows[0].count} results`);
            } catch (e: any) {
                console.log(`   "${query}" (plain): ERROR - ${e.message}`);
            }

            // Testing with websearch_to_tsquery which is often better for user input
            try {
                const webResult = await client.query(
                    "SELECT COUNT(*) as count FROM articulos WHERE search_vector @@ websearch_to_tsquery('spanish_unaccent', $1)",
                    [query]
                );
                console.log(`   "${query}" (websearch): ${webResult.rows[0].count} results`);
            } catch (e: any) {
                console.log(`   "${query}" (websearch): ERROR - ${e.message}`);
            }
        }

        // Check if the word appears in the cleaned content
        console.log("\n3. Checking if name appears in cleaned content...");
        const nameCheck = await client.query(`
      SELECT 
        arti_cod,
        arti_titulo as title,
        strip_rtf_content(arti_contenido) ILIKE '%necrología%' as has_necrologia_accent,
        strip_rtf_content(arti_contenido) ILIKE '%necrologia%' as has_necrologia_no_accent
      FROM articulos
      WHERE arti_cod = 3443
    `);

        if (nameCheck.rows.length > 0) {
            const row = nameCheck.rows[0];
            console.log(`   Has "necrología": ${row.has_necrologia_accent}`);
            console.log(`   Has "necrologia": ${row.has_necrologia_no_accent}`);
        }

        // Check rank for "jose anjel montero"
        console.log("\n4. Checking rank for 'jose anjel montero' on article 3443...");
        const rankCheck = await client.query(`
            SELECT 
                ts_rank(search_vector, websearch_to_tsquery('spanish_unaccent', 'jose anjel montero')) as rank,
                search_vector @@ websearch_to_tsquery('spanish_unaccent', 'jose anjel montero') as matches
            FROM articulos
            WHERE arti_cod = 3443
        `);

        if (rankCheck.rows.length > 0) {
            console.log(`   Matches: ${rankCheck.rows[0].matches}`);
            console.log(`   Rank: ${rankCheck.rows[0].rank}`);
        }

        // Check top 5 ranking articles for "jose anjel montero"
        console.log("\n5. Top 5 ranked articles for 'jose anjel montero'...");
        const top5 = await client.query(`
            SELECT 
                arti_cod, 
                arti_titulo as title,
                ts_rank(search_vector, websearch_to_tsquery('spanish_unaccent', 'jose anjel montero')) as rank
            FROM articulos
            WHERE search_vector @@ websearch_to_tsquery('spanish_unaccent', 'jose anjel montero')
            ORDER BY rank DESC
            LIMIT 5
        `);

        top5.rows.forEach((row, i) => {
            console.log(`   ${i + 1}. [${row.arti_cod}] "${row.title}" (Rank: ${row.rank})`);
        });

        await client.end();
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        await client.end();
        process.exit(1);
    }
}

investigateSearch();
