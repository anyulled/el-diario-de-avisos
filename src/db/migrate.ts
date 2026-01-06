import * as dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

dotenv.config({ path: ".env.local" });

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool);

  try {
    console.log("Enabling pgvector extension...");
    await db.execute("CREATE EXTENSION IF NOT EXISTS vector");
    console.log("Extension enabled.");
  } catch (e) {
    console.error("Failed to enable extension:", e);
  }

  console.log("Running migrations...");
  try {
    await migrate(db, { migrationsFolder: "drizzle" });
    console.log("Migrations completed!");
  } catch (e) {
    console.error("Migrations failed:", e);
    throw e;
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed!");
  console.error(err);
  process.exit(1);
});
