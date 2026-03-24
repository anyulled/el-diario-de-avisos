import { db } from "./src/db";
import { sql } from "drizzle-orm";
async function run() {
    try {
        const res = await db.execute(sql`SELECT reltuples::bigint AS estimate FROM pg_class WHERE relname = 'articulos'`);
        console.log(res);
    } catch (e) {
        console.error(e);
    }
}
run();
