import "dotenv/config";
import fs from "fs";
import path from "path";
import { Client } from "pg";

async function runMigration() {
  console.log("🚀 Running Unaccent Search Migration...\n");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    // Read the migration file
    const migrationPath = path.join(process.cwd(), "drizzle", "migrations", "enable_unaccent.sql");
    const migrationSql = fs.readFileSync(migrationPath, "utf-8");

    console.log("1. Executing migration SQL...");
    const startTime = Date.now();

    await client.query(migrationSql);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`   ✅ Completed in ${duration}s`);

    console.log("\n✅ Migration completed successfully!");

    console.log("📊 Verifying results with 'necro' check...\n");

    // Quick verification
    const queries = ["necrologia", "necrología"];
    for (const query of queries) {
      const result = await client.query(
        "SELECT COUNT(*) as count FROM articulos WHERE search_vector @@ to_tsquery('spanish_unaccent', $1)",
        [query]
      );
      console.log(`   "${query}": ${result.rows[0].count} results`);
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
