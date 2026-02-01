"use server";

import { db } from "@/db";
import { articles, developers, essays, members, publicationColumns, publications, tutors } from "@/db/schema";
import { normalizeDateRange } from "@/lib/date-range";
import { getNewsOrderBy } from "@/lib/news-order";
import { and, eq, getTableColumns, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

// GetYears removed

export const getNewsTypes = unstable_cache(
  async () => {
    return await db.select().from(publicationColumns);
  },
  ["news-types"],
  {
    revalidate: 3600,
    tags: ["news-types"],
  },
);

export const getPublications = unstable_cache(
  async () => {
    return await db.select().from(publications);
  },
  ["publications"],
  {
    revalidate: 3600,
    tags: ["publications"],
  },
);

export type SearchParams = {
  year?: number | string | null;
  text?: string | null;
  type?: number | string | null;
  pubId?: number | string | null;
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
  pubId: number | null | undefined,
) {
  const conditions = [];
  if (year) {
    conditions.push(eq(articles.publicationYear, year));
  }
  if (type) {
    conditions.push(eq(articles.columnId, type));
  }
  if (pubId) {
    conditions.push(eq(articles.pubId, pubId));
  }
  if (text) {
    conditions.push(sql`${articles.searchVector} @@ websearch_to_tsquery('spanish_unaccent', ${text})`);
  }
  const { start, end, isValidRange } = normalizeDateRange({ start: dateFrom, end: dateTo });
  if (isValidRange) {
    // Optimization: Use direct comparison instead of DATE() function to allow index usage (Sargable query)
    if (start) {
      conditions.push(sql`${articles.date} >= ${start}::date`);
    }
    if (end) {
      conditions.push(sql`${articles.date} < ${end}::date + interval '1 day'`);
    }
  }
  return conditions;
}

export async function getNews(params: SearchParams) {
  const { year: rawYear, text, type: rawType, pubId: rawPubId, dateFrom, dateTo, page: rawPage = 1, pageSize: rawPageSize = 20, sort } = params;
  const page = Number(rawPage);
  const pageSize = Number(rawPageSize);

  const safelyParseInt = (curr: string | number | null | undefined): number | null => {
    if (curr === null || curr === undefined) return null;
    const parsed = Number(curr);
    if (Number.isNaN(parsed)) return null;
    return parsed;
  };

  const year = safelyParseInt(rawYear);
  const type = safelyParseInt(rawType);
  const pubId = safelyParseInt(rawPubId);

  const conditions = getNewsConditions(year, type, text, dateFrom, dateTo, pubId);

  // Count total results
  const countQuery = db
    .select({ count: sql<number>`count(*)` })
    .from(articles)
    .$dynamic();

  const countWithConditions = conditions.length > 0 ? countQuery.where(and(...conditions)) : countQuery;

  // Build query with conditional fields and ordering
  const query = db
    .select({
      id: articles.id,
      title: articles.title,
      subtitle: articles.subtitle,
      date: articles.date,
      dateOld: articles.dateOld,
      columnId: articles.columnId,
      pubId: articles.pubId,
      issueId: articles.issueId,
      page: articles.page,
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
      plainText: articles.plainText,
      // Add relevance ranking when searching
      ...(text ? { rank: sql<number>`ts_rank(${articles.searchVector}, websearch_to_tsquery('spanish_unaccent', ${text}))` } : {}),
    })
    .from(articles)
    .$dynamic();

  const queryWithConditions = conditions.length > 0 ? query.where(and(...conditions)) : query;

  const orderBy = getNewsOrderBy(sort, text);

  const [countResult, data] = await Promise.all([
    countWithConditions,
    queryWithConditions
      .orderBy(...orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  const total = Number(countResult[0]?.count || 0);

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

export async function getDevelopers() {
  return await db.select().from(developers);
}

const getCachedArticle = unstable_cache(
  async (id: number) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { searchVector, ...rest } = getTableColumns(articles);
    const result = await db.select(rest).from(articles).where(eq(articles.id, id)).limit(1);
    const article = result[0];

    if (article?.content && Buffer.isBuffer(article.content)) {
      return {
        ...article,
        content: article.content.toString("base64") as unknown as Buffer,
      };
    }

    return article;
  },
  ["article-by-id-v2"],
  { tags: ["articles"], revalidate: 3600 },
);

export async function getArticleById(id: number) {
  const article = await getCachedArticle(id);
  if (!article) return article;

  if (typeof article.content === "string") {
    return {
      ...article,
      content: Buffer.from(article.content, "base64"),
    };
  }

  /**
   * Handle Buffer deserialization from cache
   * Unstable_cache serializes Buffers to {type: 'Buffer', data: [...]} format
   */
  if (article.content && typeof article.content === "object" && !Buffer.isBuffer(article.content)) {
    const obj = article.content as { type: string; data: number[] };
    if (obj.type === "Buffer" && Array.isArray(obj.data)) {
      return {
        ...article,
        content: Buffer.from(obj.data),
      };
    }
  }

  return article;
}

export async function getEssays() {
  const essaysList = await db
    .select({
      id: essays.id,
      title: essays.title,
      groupName: publications.name,
    })
    .from(essays)
    .leftJoin(publications, eq(essays.pubId, publications.id));

  return essaysList.map((essay) => ({
    id: essay.id,
    title: essay.title,
    groupName: essay.groupName ?? "Publicación Desconocida",
  }));
}

export async function getEssayById(id: number) {
  const result = await db.select().from(essays).where(eq(essays.id, id)).limit(1);
  return result[0];
}

export async function getArticleSection(columnId: number) {
  const result = await db.select().from(publicationColumns).where(eq(publicationColumns.id, columnId)).limit(1);
  return result[0];
}

import { processRtfContent } from "@/lib/rtf-content-converter";

export async function getArticlesOnThisDay(day: number, month: number) {
  return await unstable_cache(
    async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { searchVector, ...columns } = getTableColumns(articles);
      const news = await db
        .select(columns)
        .from(articles)
        .where(sql`EXTRACT(MONTH FROM ${articles.date}) = ${month} AND EXTRACT(DAY FROM ${articles.date}) = ${day}`)
        .orderBy(sql`RANDOM()`)
        .limit(10);

      return await Promise.all(
        news.map(async (item) => {
          const { content, plainText, ...rest } = item;
          const extract =
            plainText !== null && plainText !== undefined ? plainText.slice(0, 500) : await processRtfContent(content as Buffer | null, { maxLength: 500 });
          return {
            ...rest,
            plainText,
            extract,
          };
        }),
      );
    },
    [`articles-on-this-day-${month}-${day}`],
    { revalidate: 86400 },
  )();
}
