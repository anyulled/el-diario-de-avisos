import "dotenv/config";
import { eq, isNull, sql } from "drizzle-orm";
import iconv from "iconv-lite";
import { db } from "../src/db";
import { articleEmbeddings, articles, essayEmbeddings, essays } from "../src/db/schema";
import { generateEmbeddingsBatch } from "../src/lib/ai";
// @ts-expect-error - rtf-to-html type definitions are missing
import { fromString } from "@iarna/rtf-to-html";
import { promisify } from "util";

const rtfToHtml = promisify(fromString);

/**
 * Strips HTML tags from a string and returns plain text
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Processes RTF or plain text content and returns clean plain text
 */
async function processRtf(content: Buffer | string | null): Promise<string> {
  if (!content) return "";
  try {
    const contentString = Buffer.isBuffer(content) ? iconv.decode(content, "win1252") : String(content);

    // Detect if content is RTF format (starts with {\rtf) or plain text
    const isRtf = contentString.trim().startsWith("{\\rtf");

    if (!isRtf) {
      // For plain text, just return it cleaned up
      // Remove excessive whitespace but preserve paragraph structure
      return contentString
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
        .join("\n\n");
    }

    // Process RTF content
    // Minimal unescape for RAG quality
    const unescapedRtf = contentString.replace(/\\'([0-9a-fA-F]{2})/g, (match, hex) => {
      const code = parseInt(hex, 16);
      return code >= 0x80 && code <= 0xff ? String.fromCharCode(code) : match;
    });

    const html = await rtfToHtml(unescapedRtf, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      template: (_doc: any, _defaults: any, content: string) => content,
    });

    return stripHtml(html);
  } catch (e) {
    console.error("Content processing error:", e);
    // Fallback: return raw content if available
    const fallback = Buffer.isBuffer(content) ? iconv.decode(content, "win1252") : String(content);
    return fallback || "";
  }
}

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
async function ingestEntities(config: IngestConfig) {
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
      const plainText = await processRtf(entity.content as Buffer);
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

    console.log("💾 Saving embeddings to database...");

    // Save embeddings to database
    for (const [i, entity] of validData.entries()) {
      await db
        .insert(config.embeddingTable)
        .values({
          [config.embeddingIdColumn.name]: entity.id,
          embedding: allEmbeddings[i],
        })
        .onConflictDoUpdate({
          target: config.embeddingIdColumn,
          set: {
            embedding: allEmbeddings[i],
            updatedAt: sql`now()`,
          },
        });
    }

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
async function ingestArticles() {
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
async function ingestEssays() {
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
async function ingest() {
  await ingestArticles();
  console.log("--------------------------------");
  await ingestEssays();
}

// Run if called directly
ingest()
  .catch(console.error)
  .finally(() => process.exit());
