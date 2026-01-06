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
  page?: number | string;
  pageSize?: number | string;
  sort?: string | null;
};

export async function getNews(params: SearchParams) {
  const { year, text, type, page: rawPage = 1, pageSize: rawPageSize = 20, sort } = params;
  const page = Number(rawPage);
  const pageSize = Number(rawPageSize);

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
      sql`${articles.searchVector} @@ websearch_to_tsquery('spanish_unaccent', ${text})`
    );
  }

  // Count total results
  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .$dynamic();

  const countWithConditions = conditions.length > 0
    ? countQuery.where(and(...conditions))
    : countQuery;

  const [totalResult] = await countWithConditions;
  const total = Number(totalResult?.count || 0);

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
      ...(text ? { rank: sql<number>`ts_rank(${articles.searchVector}, websearch_to_tsquery('spanish_unaccent', ${text}))` } : {}),
    })
    .from(articles)
    .$dynamic();

  const queryWithConditions = conditions.length > 0
    ? query.where(and(...conditions))
    : query;

  // Determine sort order
  let orderBy;
  switch (sort) {
    case "date_asc":
      orderBy = [articles.date];
      break;
    case "date_desc":
      orderBy = [desc(articles.date)];
      break;
    case "id_asc":
      orderBy = [articles.id];
      break;
    case "id_desc":
      orderBy = [desc(articles.id)];
      break;
    case "rank":
      orderBy = text ? [sql`ts_rank(${articles.searchVector}, websearch_to_tsquery('spanish_unaccent', ${text})) DESC`] : [desc(articles.date)];
      break;
    default:
      orderBy = text ? [sql`ts_rank(${articles.searchVector}, websearch_to_tsquery('spanish_unaccent', ${text})) DESC`] : [desc(articles.date)];
  }

  const data = await queryWithConditions.orderBy(...orderBy).limit(pageSize).offset((page - 1) * pageSize);

  return {
    data,
    total,
  };
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
