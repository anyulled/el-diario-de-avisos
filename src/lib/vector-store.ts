import { db } from "@/db";
import { articleEmbeddings, articles, essayEmbeddings, essays, publications } from "@/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { generateEmbedding } from "./ai";
import { processRtfContent, stripHtml } from "./rtf-content-converter";

export interface SearchResult {
  id: number;
  title: string | null;
  date: string | null;
  similarity: number;
  type: "article" | "essay";
  contentSnippet: string;
  publicationName?: string | null;
}

// Helper to process RTF/plain text content and return a plain text snippet
async function getContentSnippet(content: Buffer | string | null, maxLength = 1000): Promise<string> {
  return processRtfContent(content, { maxLength, preserveParagraphs: false });
}

// Internal type for initial DB results (without content snippet)
interface RawSearchResult {
  id: number;
  title: string | null;
  date: string | null;
  similarity: number;
  publicationName?: string | null;
}

// Internal function for vector search of articles
async function findVectorArticles(embedding: number[], limit = 5): Promise<RawSearchResult[]> {
  const similarity = sql<number>`1 - (${articleEmbeddings.embedding} <=> ${JSON.stringify(embedding)}::vector)`;

  return await db
    .select({
      id: articles.id,
      title: articles.title,
      date: articles.date,
      similarity,
      publicationName: publications.name,
    })
    .from(articleEmbeddings)
    .innerJoin(articles, eq(articleEmbeddings.articleId, articles.id))
    .leftJoin(publications, eq(articles.pubId, publications.id))
    .where(sql`${similarity} > 0.5`)
    .orderBy(sql`${articleEmbeddings.embedding} <=> ${JSON.stringify(embedding)}::vector`)
    .limit(limit);
}

// Internal function for essay vector search
async function findVectorEssays(embedding: number[], limit = 5): Promise<RawSearchResult[]> {
  const similarity = sql<number>`1 - (${essayEmbeddings.embedding} <=> ${JSON.stringify(embedding)}::vector)`;

  return await db
    .select({
      id: essays.id,
      title: essays.title,
      date: sql<null>`null`.as("date"),
      similarity,
      publicationName: publications.name,
    })
    .from(essayEmbeddings)
    .innerJoin(essays, eq(essayEmbeddings.essayId, essays.id))
    .leftJoin(publications, eq(essays.pubId, publications.id))
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
      publicationName: publications.name,
    })
    .from(articles)
    .leftJoin(publications, eq(articles.pubId, publications.id))
    .where(sql`${articles.searchVector} @@ websearch_to_tsquery('spanish_unaccent', ${query})`)
    .orderBy(sql`ts_rank(${articles.searchVector}, websearch_to_tsquery('spanish_unaccent', ${query})) DESC`)
    .limit(limit);
}

// Fetch content for articles by IDs
async function fetchArticleContent(ids: number[]): Promise<Map<number, { snippet?: string; content: Buffer | null }>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({
      id: articles.id,
      snippet: sql<string>`substring(${articles.plainText} from 1 for 1000)`,
      content: sql<Buffer | null>`CASE WHEN ${articles.plainText} IS NULL THEN ${articles.content} ELSE NULL END`,
    })
    .from(articles)
    .where(inArray(articles.id, ids));

  return new Map(rows.map((r) => [r.id, { snippet: r.snippet ?? undefined, content: r.content }]));
}

// Fetch content for essays by IDs
async function fetchEssayContent(ids: number[]): Promise<Map<number, Buffer | null>> {
  if (ids.length === 0) return new Map();
  const rows = await db.select({ id: essays.id, content: essays.content }).from(essays).where(inArray(essays.id, ids));
  return new Map(rows.map((r) => [r.id, r.content as Buffer | null]));
}

// Main hybrid search function
export async function findSimilarArticles(query: string, limit = 5): Promise<SearchResult[]> {
  // Generate embedding once for reuse in both vector searches
  const embedding = await generateEmbedding(query);

  // Run all searches in parallel
  const [vectorResults, essayResults, keywordResults] = await Promise.all([
    findVectorArticles(embedding, limit),
    findVectorEssays(embedding, limit),
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

  // Build final results with content snippets (parallel processing)
  const articleResultsPromises = articleCandidates.map(async (article) => {
    const data = articleContentMap.get(article.id);
    const snippet = data?.snippet ? stripHtml(data.snippet) : await getContentSnippet(data?.content ?? null);

    return {
      ...article,
      contentSnippet: snippet,
    };
  });

  const essayResultsPromises = essayCandidates.map(async (essay) => {
    const content = essayContentMap.get(essay.id) ?? null;
    const snippet = await getContentSnippet(content);
    return {
      ...essay,
      contentSnippet: snippet,
    };
  });

  // Wait for all snippet generation to complete in parallel
  const [processedArticles, processedEssays] = await Promise.all([Promise.all(articleResultsPromises), Promise.all(essayResultsPromises)]);

  const finalResults: SearchResult[] = [...processedArticles, ...processedEssays];

  // Sort by similarity descending
  finalResults.sort((a, b) => b.similarity - a.similarity);

  // Return top results
  return finalResults.slice(0, limit + 2);
}
