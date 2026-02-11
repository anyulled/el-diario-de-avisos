import "dotenv/config";
import { fileURLToPath } from "url";
import { resolve } from "path";
import { eq, isNull, sql } from "drizzle-orm";
import { db } from "../src/db";
import { articleEmbeddings, articles, essayEmbeddings, essays } from "../src/db/schema";
import { generateEmbeddingsBatch } from "../src/lib/ai";
import { processRtfContent } from "../src/lib/rtf-content-converter";

/**
 * Configuration for ingesting different entity types
 */
interface IngestConfig {
  entityName: string;
  entityTable: typeof articles | typeof essays;
  embeddingTable: typeof articleEmbeddings | typeof essayEmbeddings;
  entityIdColumn: typeof articles.id | typeof essays.id;
  embeddingIdColumn: typeof articleEmbeddings.articleId | typeof essayEmbeddings.essayId;
  batchLimit: number;
  embeddingBatchSize: number;
}

/**
 * Generic ingestion function that handles both articles and essays
 */
export async function ingestEntities(config: IngestConfig) {
  console.log(`🚀 Starting ${config.entityName} Ingestion...`);

  // Count total entities without embeddings
  const totalPendingResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(config.entityTable)
    .leftJoin(config.embeddingTable, eq(config.entityIdColumn, config.embeddingIdColumn))
    .where(isNull(config.embeddingIdColumn));

  const totalPending = totalPendingResult[0]?.count ?? 0;

  if (totalPending === 0) {
    console.log(`✅ All ${config.entityName.toLowerCase()} already have embeddings.`);
    return;
  }

  console.log(`📊 Total ${config.entityName.toLowerCase()} without embeddings: ${totalPending}`);

  // Find entities that don't have embeddings yet
  const pendingEntities = await db
    .select({
      id: config.entityIdColumn,
      title: config.entityTable.title,
      content: config.entityTable.content,
    })
    .from(config.entityTable)
    .leftJoin(config.embeddingTable, eq(config.entityIdColumn, config.embeddingIdColumn))
    .where(isNull(config.embeddingIdColumn))
    .limit(config.batchLimit);

  console.log(`📦 Processing ${pendingEntities.length} ${config.entityName.toLowerCase()} in this batch...`);

  // Process content to plain text
  const processedData = await Promise.all(
    pendingEntities.map(async (entity) => {
      const plainText = await processRtfContent(entity.content as Buffer);
      // Combine title and content for better context
      const fullText = `${entity.title || ""}\n${plainText}`.slice(0, 8000);
      return { id: entity.id, text: fullText };
    }),
  );

  const validData = processedData.filter((d) => d.text.trim().length > 10);

  if (validData.length === 0) {
    console.log("⚠️ No valid content found in this batch.");
    return;
  }

  try {
    const allEmbeddings: number[][] = [];

    // Generate embeddings in sub-batches
    // eslint-disable-next-line no-restricted-syntax
    for (let i = 0; i < validData.length; i += config.embeddingBatchSize) {
      const subBatch = validData.slice(i, i + config.embeddingBatchSize);
      const batchNumber = Math.floor(i / config.embeddingBatchSize) + 1;
      const totalBatches = Math.ceil(validData.length / config.embeddingBatchSize);
      console.log(`📡 Generating embeddings for sub-batch ${batchNumber}/${totalBatches}...`);
      const subEmbeddings = await generateEmbeddingsBatch(subBatch.map((d) => d.text));
      allEmbeddings.push(...subEmbeddings);
    }

    const idPropName = config.entityName === "Articles" ? "articleId" : "essayId";
    const values = validData.map((entity, i) => ({
      [idPropName]: entity.id,
      embedding: allEmbeddings[i],
    }));

    console.log(`💾 Saving ${values.length} embeddings to database using property: ${idPropName}...`);
    if (values.length > 0) {
      console.log("DEBUG: First value sample keys:", Object.keys(values[0]));
      console.log("DEBUG: First value sample ID:", (values[0] as Record<string, unknown>)[idPropName]);
    }

    await db
      .insert(config.embeddingTable)
      .values(values)
      .onConflictDoUpdate({
        target: config.embeddingIdColumn,
        set: {
          embedding: sql`excluded.embedding`,
          updatedAt: sql`now()`,
        },
      });

    console.log(`✨ Successfully ingested ${validData.length} embeddings.`);

    // Show remaining count
    const remaining = totalPending - validData.length;
    if (remaining > 0) {
      console.log(`📊 Remaining ${config.entityName.toLowerCase()} without embeddings: ${remaining}`);
      console.log(`💡 Run 'npm run ingest' again to process the next batch.`);
    } else {
      console.log(`🎉 All ${config.entityName.toLowerCase()} now have embeddings!`);
    }
  } catch (e) {
    console.error(`❌ ${config.entityName} ingestion failed:`, e);
  }
}

/**
 * Ingest articles using the generic function
 */
export async function ingestArticles() {
  await ingestEntities({
    entityName: "Articles",
    entityTable: articles,
    embeddingTable: articleEmbeddings,
    entityIdColumn: articles.id,
    embeddingIdColumn: articleEmbeddings.articleId,
    batchLimit: 500,
    embeddingBatchSize: 100,
  });
}

/**
 * Ingest essays using the generic function
 */
export async function ingestEssays() {
  await ingestEntities({
    entityName: "Essays",
    entityTable: essays,
    embeddingTable: essayEmbeddings,
    entityIdColumn: essays.id,
    embeddingIdColumn: essayEmbeddings.essayId,
    batchLimit: 100,
    embeddingBatchSize: 100,
  });
}

/**
 * Main ingestion function that processes both articles and essays
 */
export async function ingest() {
  await ingestArticles();
  console.log("--------------------------------");
  await ingestEssays();
}

// Run if called directly
const isMainModule = () => {
  // Check if running in a CommonJS environment
  if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
    return true;
  }
  // Check if running in an ESM environment
  if (import.meta.url) {
    const scriptPath = fileURLToPath(import.meta.url);
    // Normalize paths for comparison
    return process.argv[1] === scriptPath || resolve(process.argv[1]) === scriptPath;
  }
  return false;
};

if (isMainModule()) {
  const args = process.argv.slice(2);
  const runAll = args.includes("--all");

  const run = async () => {
    if (runAll) {
      console.log("🔄 Running in continuous mode (--all)...");
      while (true) {
        // We need to re-check counts inside the loop
        await ingest();

        // Helper function to check pending count:
        const pendingArticles = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(articles)
          .leftJoin(articleEmbeddings, eq(articles.id, articleEmbeddings.articleId))
          .where(isNull(articleEmbeddings.articleId));

        const pendingEssays = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(essays)
          .leftJoin(essayEmbeddings, eq(essays.id, essayEmbeddings.essayId))
          .where(isNull(essayEmbeddings.essayId));

        if ((pendingArticles[0]?.count ?? 0) === 0 && (pendingEssays[0]?.count ?? 0) === 0) {
          console.log("✨ All ingestion complete!");
          break;
        }
        console.log("⏳ Continuing to next batch...");
      }
    } else {
      await ingest();
    }
  };

  run()
    .catch(console.error)
    .finally(() => process.exit());
}
