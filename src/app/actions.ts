"use server";

import { db } from "@/db";
import { articles, essays, members, publicationColumns, tutors } from "@/db/schema";
import { normalizeDateRange } from "@/lib/date-range";
import { getNewsOrderBy } from "@/lib/news-order";
import { and, eq, sql } from "drizzle-orm";

// getYears removed

export async function getNewsTypes() {
  return await db.select().from(publicationColumns);
}

export type SearchParams = {
  year?: number | null;
  text?: string | null;
  type?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  page?: number | string;
  pageSize?: number | string;
  sort?: string | null;
};

function getNewsConditions(
  year: number | null | undefined,
  type: number | null | undefined,
  text: string | null | undefined,
  dateFrom: string | null | undefined,
  dateTo: string | null | undefined,
) {
  const conditions = [];
  if (year) {
    conditions.push(eq(articles.publicationYear, year));
  }
  if (type) {
    conditions.push(eq(articles.columnId, type));
  }
  if (text) {
    conditions.push(sql`${articles.searchVector} @@ websearch_to_tsquery('spanish_unaccent', ${text})`);
  }
  const { start, end, isValidRange } = normalizeDateRange({ start: dateFrom, end: dateTo });
  if (isValidRange) {
    if (start) {
      conditions.push(sql`DATE(${articles.date}) >= ${start}`);
    }
    if (end) {
      conditions.push(sql`DATE(${articles.date}) <= ${end}`);
    }
  }
  return conditions;
}

export async function getNews(params: SearchParams) {
  const { year, text, type, dateFrom, dateTo, page: rawPage = 1, pageSize: rawPageSize = 20, sort } = params;
  const page = Number(rawPage);
  const pageSize = Number(rawPageSize);

  const conditions = getNewsConditions(year, type, text, dateFrom, dateTo);

  // Count total results
  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .$dynamic();

  const countWithConditions = conditions.length > 0 ? countQuery.where(and(...conditions)) : countQuery;

  const [totalResult] = await countWithConditions;
  const total = Number(totalResult?.count || 0);

  // Build query with conditional fields and ordering
  const query = db
    .select({
      id: articles.id,
      title: articles.title,
      subtitle: articles.subtitle,
      date: articles.date,
      timestampColumn: articles.timestampColumn,
      dateOld: articles.dateOld,
      columnId: articles.columnId,
      pubId: articles.pubId,
      issueId: articles.issueId,
      page: articles.page,
      content: articles.content,
      cota: articles.cota,
      code2: articles.code2,
      authorId: articles.authorId,
      isEditable: articles.isEditable,
      observations: articles.observations,
      publicationYear: articles.publicationYear,
      publicationMonth: articles.publicationMonth,
      issueNumber: articles.issueNumber,
      series: articles.series,
      microfilm: articles.microfilm,
      searchVector: articles.searchVector,
      // Add relevance ranking when searching
      ...(text ? { rank: sql<number>`ts_rank(${articles.searchVector}, websearch_to_tsquery('spanish_unaccent', ${text}))` } : {}),
    })
    .from(articles)
    .$dynamic();

  const queryWithConditions = conditions.length > 0 ? query.where(and(...conditions)) : query;

  const orderBy = getNewsOrderBy(sort, text);

  const data = await queryWithConditions
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

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
  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return result[0];
}

export async function getEssays() {
  return await db.select({ id: essays.id, title: essays.title }).from(essays);
}

export async function getEssayById(id: number) {
  const result = await db.select().from(essays).where(eq(essays.id, id)).limit(1);
  return result[0];
}

export async function getArticleSection(columnId: number) {
  const result = await db.select().from(publicationColumns).where(eq(publicationColumns.id, columnId)).limit(1);
  return result[0];
}
