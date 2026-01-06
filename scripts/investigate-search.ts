import "dotenv/config";
import { Client } from "pg";

async function investigateSearch() {
    console.log("🔍 Investigating search for 'José Ángel Montero'...\n");

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
        }

        // Test various search queries
        console.log("\n2. Testing search queries...");

        const queries = [
            "José",
            "jose",
            "Ángel",
            "angel",
            "Montero",
            "montero",
            "José & Ángel",
            "jose & angel",
            "Montero"
        ];

        for (const query of queries) {
            try {
                const result = await client.query(
                    "SELECT COUNT(*) as count FROM articulos WHERE search_vector @@ to_tsquery('spanish', $1)",
                    [query]
                );
                console.log(`   "${query}": ${result.rows[0].count} results`);
            } catch (e: any) {
                console.log(`   "${query}": ERROR - ${e.message}`);
            }
        }

        // Check if the name appears in the cleaned content
        console.log("\n3. Checking if name appears in cleaned content...");
        const nameCheck = await client.query(`
      SELECT 
        arti_cod,
        arti_titulo as title,
        strip_rtf_content(arti_contenido) LIKE '%Montero%' as has_montero,
        strip_rtf_content(arti_contenido) LIKE '%José%' as has_jose,
        strip_rtf_content(arti_contenido) LIKE '%ngel%' as has_angel_partial
      FROM articulos
      WHERE arti_cod = 3443
    `);

        if (nameCheck.rows.length > 0) {
            const row = nameCheck.rows[0];
            console.log(`   Has "Montero": ${row.has_montero}`);
            console.log(`   Has "José": ${row.has_jose}`);
            console.log(`   Has "ngel" (partial): ${row.has_angel_partial}`);
        }

        await client.end();
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        await client.end();
        process.exit(1);
    }
}

investigateSearch();
