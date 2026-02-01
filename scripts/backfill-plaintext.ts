import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { db } from "@/db";
import { articles } from "@/db/schema";
import { processRtfContent } from "@/lib/rtf-content-converter";
import { isNull, count, eq } from "drizzle-orm";

async function main() {
  console.log("Starting backfill of plainText column...");

  // Count
  const [{ value: total }] = await db
    .select({ value: count() })
    .from(articles)
    .where(isNull(articles.plainText));

  console.log(`Found ${total} articles to process.`);

  if (total === 0) {
      console.log("Nothing to do.");
      return;
  }

  const BATCH_SIZE = 50;
  let processed = 0;

  while (true) {
      const batch = await db
        .select({ id: articles.id, content: articles.content })
        .from(articles)
        .where(isNull(articles.plainText))
        .limit(BATCH_SIZE);

      if (batch.length === 0) break;

      console.log(`Processing batch of ${batch.length}...`);

      await Promise.all(batch.map(async (item) => {
          try {
             const text = await processRtfContent(item.content, { preserveParagraphs: true });

             await db
                .update(articles)
                .set({ plainText: text })
                .where(eq(articles.id, item.id));

          } catch (err) {
              console.error(`Failed to process article ${item.id}:`, err);
              // Mark as empty string to avoid infinite loop
              await db.update(articles).set({ plainText: "" }).where(eq(articles.id, item.id));
          }
      }));

      processed += batch.length;
      console.log(`Progress: ${processed}/${total}`);
  }

  console.log("Backfill complete.");
}

main().catch(console.error).finally(() => process.exit());
