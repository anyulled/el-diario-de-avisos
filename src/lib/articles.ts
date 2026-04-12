import { unstable_cache } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const getArticleCount = unstable_cache(
  async () => {
    try {
      // ⚡ Bolt: Use fast-path pg_class estimate instead of full table scan count(*) to prevent DB quota exhaustion
      const result = await db.execute(sql`SELECT reltuples::bigint AS estimate FROM pg_class WHERE oid = 'articulos'::regclass`);
      const estimate = Number(result.rows[0]?.estimate || 0);
      return estimate;
    } catch (error) {
      console.error("Error fetching article count:", error);
      // Return 0 to prevent the UI from crashing if the database is unavailable
      return 0;
    }
  },
  ["article-count"],
  {
    /*
     * We cache this for 15 days because the total article count helps with SEO and credibility, but it doesn't need to be real-time accurate.
     * This long cache duration significantly reduces database load for a metric that changes slowly.
     */
    revalidate: 1296000,
    tags: ["articles"],
  },
);

export function formatArticleCount(count: number): string {
  // If the count is valid, round it down to the nearest hundred and format it
  if (count > 0) {
    return `${(Math.floor(count / 100) * 100).toLocaleString("en-US")}+`;
  }
  // Fallback to a static number if the count is invalid (0 or negative), preventing a "0 articles" display
  return "22,900+";
}
