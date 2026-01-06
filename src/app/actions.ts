"use server";

import { db } from "@/db";
import { articles, members, publicationColumns, tutors } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export async function getYears() {
  const result = await db
    .selectDistinct({ year: articles.publicationYear })
    .from(articles)
    .orderBy(desc(articles.publicationYear));
  return result.map((r) => r.year).filter((y) => y != null) as number[];
}

export async function getNewsTypes() {
  return await db.select().from(publicationColumns);
}

export type SearchParams = {
  year?: number | null;
  text?: string | null;
  type?: number | null;
  page?: number;
};

export async function getNews(params: SearchParams) {
  const { year, text, type, page = 1 } = params;
  const pageSize = 20;

  const conditions = [];

  if (year) {
    conditions.push(eq(articles.publicationYear, year));
  }
  if (type) {
    conditions.push(eq(articles.columnId, type));
  }

  // Add full-text search condition if text is provided
  if (text) {
    conditions.push(
      sql`${articles.searchVector} @@ to_tsquery('spanish', ${text})`
    );
  }

  // Build query with conditional fields and ordering
  const query = db
    .select({
      id: articles.id,
      title: articles.title,
      subtitle: articles.subtitle,
      date: articles.date,
      publicationYear: articles.publicationYear,
      page: articles.page,
      columnId: articles.columnId,
      // Add relevance ranking when searching
      ...(text ? { rank: sql<number>`ts_rank(${articles.searchVector}, to_tsquery('spanish', ${text}))` } : {}),
    })
    .from(articles)
    .$dynamic();

  const queryWithConditions = conditions.length > 0
    ? query.where(and(...conditions))
    : query;

  // Sort by relevance if searching, otherwise by date
  const queryWithOrder = text
    ? queryWithConditions.orderBy(sql`ts_rank(${articles.searchVector}, to_tsquery('spanish', ${text})) DESC`)
    : queryWithConditions.orderBy(desc(articles.date));

  const finalQuery = queryWithOrder.limit(pageSize).offset((page - 1) * pageSize);

  return await finalQuery;
}

export async function getIntegrantes() {
  return await db.select().from(members);
}

export async function getTutores() {
  return await db.select().from(tutors);
}

export async function getArticleById(id: number) {
  const result = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  return result[0];
}
