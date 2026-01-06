import { db } from "@/db";
import { articleEmbeddings, articles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { generateEmbedding } from "./ai";

export interface SearchResult {
  id: number;
  title: string | null;
  date: string | null;
  similarity: number;
}

// Internal function for vector search
async function findVectorArticles(
  query: string,
  limit = 5,
): Promise<SearchResult[]> {
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
    .orderBy(
      sql`${articleEmbeddings.embedding} <=> ${JSON.stringify(embedding)}::vector`,
    )
    .limit(limit);
}

// Internal function for keyword search
async function findKeywordArticles(
  query: string,
  limit = 10,
): Promise<SearchResult[]> {
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

// Main hybrid search function
export async function findSimilarArticles(
  query: string,
  limit = 5,
): Promise<SearchResult[]> {
  // Run both searches in parallel
  const [vectorResults, keywordResults] = await Promise.all([
    findVectorArticles(query, limit),
    findKeywordArticles(query, 10) // Always fetch top 10 keyword matches
  ]);

  // Combine and deduplicate
  const seenIds = new Set<number>();
  const combinedResults: SearchResult[] = [];

  // Prioritize vector results but ensure we mix in keyword results
  // Strategy: Add all vector results, then add non-duplicate keyword results

  for (const res of vectorResults) {
    if (!seenIds.has(res.id)) {
      seenIds.add(res.id);
      combinedResults.push(res);
    }
  }

  for (const res of keywordResults) {
    if (!seenIds.has(res.id)) {
      seenIds.add(res.id);
      // Boost similarity for exact keyword matches to ensure they seem relevant
      // We'll assign a high artificial similarity for keyword matches to ensure they are picked up in context
      combinedResults.push({
        ...res,
        similarity: 0.95
      });
    }
  }

  // Sort by similarity descending to ensure keyword matches (0.95) rise to the top
  combinedResults.sort((a, b) => b.similarity - a.similarity);

  return combinedResults.slice(0, limit + 2); // Return a slightly larger set if mixed
}
