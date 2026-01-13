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

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

async function ingestArticles() {
  console.log("🚀 Starting Articles Ingestion...");

  // Count total articles without embeddings
  const totalPendingResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(articles)
    .leftJoin(articleEmbeddings, eq(articles.id, articleEmbeddings.articleId))
    .where(isNull(articleEmbeddings.articleId));

  const totalPending = totalPendingResult[0]?.count ?? 0;

  if (totalPending === 0) {
    console.log("✅ All articles already have embeddings.");
    return;
  }

  console.log(`📊 Total articles without embeddings: ${totalPending}`);

  // Find articles that don't have embeddings yet
  const pendingArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      content: articles.content,
    })
    .from(articles)
    .leftJoin(articleEmbeddings, eq(articles.id, articleEmbeddings.articleId))
    .where(isNull(articleEmbeddings.articleId))
    .limit(500);

  console.log(`📦 Processing ${pendingArticles.length} articles in this batch...`);

  const processedData = await Promise.all(
    pendingArticles.map(async (art) => {
      const plainText = await processRtf(art.content as Buffer);
      // Combine title and content for better context
      const fullText = `${art.title || ""}\n${plainText}`.slice(0, 8000);
      return { id: art.id, text: fullText };
    }),
  );

  const validData = processedData.filter((d) => d.text.trim().length > 10);

  if (validData.length === 0) {
    console.log("⚠️ No valid content found in this batch.");
    return;
  }

  try {
    const BATCH_SIZE = 100;
    const allEmbeddings: number[][] = [];

    // eslint-disable-next-line no-restricted-syntax
    for (let i = 0; i < validData.length; i += BATCH_SIZE) {
      const subBatch = validData.slice(i, i + BATCH_SIZE);
      console.log(`📡 Generating embeddings for sub-batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(validData.length / BATCH_SIZE)}...`);
      const subEmbeddings = await generateEmbeddingsBatch(subBatch.map((d) => d.text));
      allEmbeddings.push(...subEmbeddings);
    }

    console.log("💾 Saving embeddings to database...");

    for (const [i, article] of validData.entries()) {
      await db
        .insert(articleEmbeddings)
        .values({
          articleId: article.id,
          embedding: allEmbeddings[i],
        })
        .onConflictDoUpdate({
          target: articleEmbeddings.articleId,
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
      console.log(`📊 Remaining articles without embeddings: ${remaining}`);
      console.log(`💡 Run 'npm run ingest' again to process the next batch.`);
    } else {
      console.log(`🎉 All articles now have embeddings!`);
    }
  } catch (e) {
    console.error("❌ Batch ingestion failed:", e);
  }
}

async function ingestEssays() {
  console.log("🚀 Starting Essays Ingestion...");

  // Count total essays without embeddings
  const totalPendingEssaysResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(essays)
    .leftJoin(essayEmbeddings, eq(essays.id, essayEmbeddings.essayId))
    .where(isNull(essayEmbeddings.essayId));

  const totalPendingEssays = totalPendingEssaysResult[0]?.count ?? 0;

  if (totalPendingEssays === 0) {
    console.log("✅ All essays already have embeddings.");
    return;
  }

  console.log(`📊 Total essays without embeddings: ${totalPendingEssays}`);

  // Find essays that don't have embeddings yet
  const pendingEssays = await db
    .select({
      id: essays.id,
      title: essays.title,
      content: essays.content,
    })
    .from(essays)
    .leftJoin(essayEmbeddings, eq(essays.id, essayEmbeddings.essayId))
    .where(isNull(essayEmbeddings.essayId))
    .limit(100);

  console.log(`📦 Processing ${pendingEssays.length} essays in this batch...`);

  const processedEssays = await Promise.all(
    pendingEssays.map(async (essay) => {
      const plainText = await processRtf(essay.content as Buffer);
      const fullText = `${essay.title || ""}\n${plainText}`.slice(0, 8000);
      return { id: essay.id, text: fullText };
    }),
  );

  const validEssays = processedEssays.filter((d) => d.text.trim().length > 10);
  const BATCH_SIZE = 100;

  if (validEssays.length > 0) {
    try {
      // eslint-disable-next-line no-restricted-syntax
      for (let i = 0; i < validEssays.length; i += BATCH_SIZE) {
        const subBatch = validEssays.slice(i, i + BATCH_SIZE);
        console.log(`📡 Generating embeddings for essay sub-batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(validEssays.length / BATCH_SIZE)}...`);
        const subEmbeddings = await generateEmbeddingsBatch(subBatch.map((d) => d.text));

        console.log("💾 Saving essay embeddings to database...");

        await Promise.all(
          subBatch.map((essay, j) =>
            db
              .insert(essayEmbeddings)
              .values({
                essayId: essay.id,
                embedding: subEmbeddings[j],
              })
              .onConflictDoUpdate({
                target: essayEmbeddings.essayId,
                set: {
                  embedding: subEmbeddings[j],
                  updatedAt: sql`now()`,
                },
              }),
          ),
        );
      }
      console.log(`✨ Successfully ingested ${validEssays.length} essay embeddings.`);
    } catch (e) {
      console.error("❌ Essay ingestion failed:", e);
    }
  } else {
    console.log("⚠️ No valid essay content found in this batch.");
  }
}

async function ingest() {
  await ingestArticles();
  console.log("--------------------------------");
  await ingestEssays();
}

// Run if called directly
ingest()
  .catch(console.error)
  .finally(() => process.exit());
