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

export async function findSimilarArticles(
  query: string,
  limit = 5,
): Promise<SearchResult[]> {
  const embedding = await generateEmbedding(query);

  // Using Postgres <-> for Euclidean distance (smaller is better)
  // or <=> for cosine distance (better for embeddings)
  // Using cosine distance here
  const similarity = sql<number>`1 - (${articleEmbeddings.embedding} <=> ${JSON.stringify(embedding)}::vector)`;

  const results = await db
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

  return results;
}
