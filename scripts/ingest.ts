import "dotenv/config";
import { eq, isNull, sql } from "drizzle-orm";
import iconv from "iconv-lite";
import { db } from "../src/db";
import { articleEmbeddings, articles } from "../src/db/schema";
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
    const rtfString = Buffer.isBuffer(content)
      ? iconv.decode(content, "win1252")
      : String(content);

    // Minimal unescape for RAG quality
    const unescapedRtf = rtfString.replace(
      /\\'([0-9a-fA-F]{2})/g,
      (match, hex) => {
        const code = parseInt(hex, 16);
        return code >= 0x80 && code <= 0xff ? String.fromCharCode(code) : match;
      },
    );

    const html = await rtfToHtml(unescapedRtf, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      template: (_doc: any, _defaults: any, content: string) => content,
    });

    return stripHtml(html);
  } catch (e) {
    console.error("RTF processing error:", e);
    return "";
  }
}

async function ingest() {
  console.log("🚀 Starting ingestion...");

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
  if (pendingArticles.length === 0) {
    console.log("✅ All articles already have embeddings.");
    return;
  }

  console.log(`📦 Processing ${pendingArticles.length} articles...`);

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
      console.log(
        `📡 Generating embeddings for sub-batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(validData.length / BATCH_SIZE)}...`,
      );
      const subEmbeddings = await generateEmbeddingsBatch(
        subBatch.map((d) => d.text),
      );
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
  } catch (e) {
    console.error("❌ Batch ingestion failed:", e);
  }
}

// Run if called directly
ingest()
  .catch(console.error)
  .finally(() => process.exit());
