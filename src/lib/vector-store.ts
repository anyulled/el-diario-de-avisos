import { db } from "@/db";
import { articleEmbeddings, articles, essayEmbeddings, essays } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import iconv from "iconv-lite";
import { generateEmbedding } from "./ai";
// @ts-expect-error - rtf-to-html type definitions are missing
import { fromString } from "@iarna/rtf-to-html";
import { promisify } from "util";

const rtfToHtml = promisify(fromString);

export interface SearchResult {
  id: number;
  title: string | null;
  date: string | null;
  similarity: number;
  type: "article" | "essay";
  contentSnippet: string;
}

// Helper to strip HTML tags for plain text snippets
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Helper to process RTF/plain text content and return a plain text snippet
async function getContentSnippet(content: Buffer | string | null, maxLength = 1000): Promise<string> {
  if (!content) return "";
  try {
    const contentString = Buffer.isBuffer(content) ? iconv.decode(content, "win1252") : String(content);
    const isRtf = contentString.trim().startsWith("{\\rtf");

    if (!isRtf) {
      // Plain text: just clean up and truncate
      return contentString
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0)
        .join(" ")
        .slice(0, maxLength);
    }

    // RTF: convert to HTML then strip tags
    const unescapedRtf = contentString.replace(/\\'([0-9a-fA-F]{2})/g, (match, hex) => {
      const code = parseInt(hex, 16);
      return code >= 0x80 && code <= 0xff ? String.fromCharCode(code) : match;
    });

    const html = await rtfToHtml(unescapedRtf, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      template: (_doc: any, _defaults: any, content: string) => content,
    });

    return stripHtml(html).slice(0, maxLength);
  } catch {
    // Fallback to raw content
    const raw = Buffer.isBuffer(content) ? iconv.decode(content, "win1252") : String(content);
    return raw.slice(0, maxLength);
  }
}

// Internal type for initial DB results (without content snippet)
interface RawSearchResult {
  id: number;
  title: string | null;
  date: string | null;
  similarity: number;
}

// Internal function for vector search of articles
async function findVectorArticles(query: string, limit = 5): Promise<RawSearchResult[]> {
  const embedding = await generateEmbedding(query);

  const similarity = sql<number>`1 - (${articleEmbeddings.embedding} <=> ${JSON.stringify(embedding)}::vector)`;

  return await db
    .select({
      id: articles.id,
      title: articles.title,
      date: articles.date,
      similarity,
    })
    .from(articleEmbeddings)
    .innerJoin(articles, eq(articleEmbeddings.articleId, articles.id))
    .where(sql`${similarity} > 0.5`)
    .orderBy(sql`${articleEmbeddings.embedding} <=> ${JSON.stringify(embedding)}::vector`)
    .limit(limit);
}

// Internal function for essay vector search
async function findVectorEssays(query: string, limit = 5): Promise<RawSearchResult[]> {
  const embedding = await generateEmbedding(query);

  const similarity = sql<number>`1 - (${essayEmbeddings.embedding} <=> ${JSON.stringify(embedding)}::vector)`;

  return await db
    .select({
      id: essays.id,
      title: essays.title,
      date: sql<null>`null`.as("date"),
      similarity,
    })
    .from(essayEmbeddings)
    .innerJoin(essays, eq(essayEmbeddings.essayId, essays.id))
    .where(sql`${similarity} > 0.45`)
    .orderBy(sql`${essayEmbeddings.embedding} <=> ${JSON.stringify(embedding)}::vector`)
    .limit(limit);
}

// Internal function for keyword search
async function findKeywordArticles(query: string, limit = 10): Promise<RawSearchResult[]> {
  return await db
    .select({
      id: articles.id,
      title: articles.title,
      date: articles.date,
      similarity: sql<number>`ts_rank(${articles.searchVector}, websearch_to_tsquery('spanish_unaccent', ${query}))`,
    })
    .from(articles)
    .where(sql`${articles.searchVector} @@ websearch_to_tsquery('spanish_unaccent', ${query})`)
    .orderBy(sql`ts_rank(${articles.searchVector}, websearch_to_tsquery('spanish_unaccent', ${query})) DESC`)
    .limit(limit);
}

// Fetch content for articles by IDs
async function fetchArticleContent(ids: number[]): Promise<Map<number, Buffer | null>> {
  if (ids.length === 0) return new Map();
  const rows = await db.select({ id: articles.id, content: articles.content }).from(articles).where(inArray(articles.id, ids));
  return new Map(rows.map((r) => [r.id, r.content as Buffer | null]));
}

// Fetch content for essays by IDs
async function fetchEssayContent(ids: number[]): Promise<Map<number, Buffer | null>> {
  if (ids.length === 0) return new Map();
  const rows = await db.select({ id: essays.id, content: essays.content }).from(essays).where(inArray(essays.id, ids));
  return new Map(rows.map((r) => [r.id, r.content as Buffer | null]));
}

// Main hybrid search function
export async function findSimilarArticles(query: string, limit = 5): Promise<SearchResult[]> {
  // Run both searches in parallel
  const [vectorResults, essayResults, keywordResults] = await Promise.all([
    findVectorArticles(query, limit),
    findVectorEssays(query, limit),
    findKeywordArticles(query, 10),
  ]);

  // Track seen IDs by type to avoid duplicates within the same type
  const seenArticleIds = new Set<number>();
  const seenEssayIds = new Set<number>();

  const articleCandidates: Array<RawSearchResult & { type: "article" }> = [];
  const essayCandidates: Array<RawSearchResult & { type: "essay" }> = [];

  // Add article results from vector search
  for (const res of vectorResults) {
    if (!seenArticleIds.has(res.id)) {
      seenArticleIds.add(res.id);
      articleCandidates.push({ ...res, type: "article" });
    }
  }

  // Add essay results from vector search
  for (const res of essayResults) {
    if (!seenEssayIds.has(res.id)) {
      seenEssayIds.add(res.id);
      essayCandidates.push({ ...res, type: "essay" });
    }
  }

  // Add keyword results (only articles have keyword search)
  for (const res of keywordResults) {
    if (!seenArticleIds.has(res.id)) {
      seenArticleIds.add(res.id);
      articleCandidates.push({ ...res, similarity: 0.95, type: "article" });
    }
  }

  // Fetch content for all candidates
  const [articleContentMap, essayContentMap] = await Promise.all([
    fetchArticleContent(articleCandidates.map((a) => a.id)),
    fetchEssayContent(essayCandidates.map((e) => e.id)),
  ]);

  // Build final results with content snippets
  const finalResults: SearchResult[] = [];

  for (const article of articleCandidates) {
    const content = articleContentMap.get(article.id);
    const snippet = await getContentSnippet(content);
    finalResults.push({
      ...article,
      contentSnippet: snippet,
    });
  }

  for (const essay of essayCandidates) {
    const content = essayContentMap.get(essay.id);
    const snippet = await getContentSnippet(content);
    finalResults.push({
      ...essay,
      contentSnippet: snippet,
    });
  }

  // Sort by similarity descending
  finalResults.sort((a, b) => b.similarity - a.similarity);

  // Return top results
  return finalResults.slice(0, limit + 2);
}
