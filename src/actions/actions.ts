"use server";

import { db } from "@/db";
import { articles, essays, publicationColumns, publications } from "@/db/schema";
import { normalizeDateRange } from "@/lib/date-range";
import { getNewsOrderBy } from "@/lib/news-order";
import { processRtfContent as processRtfContentHtml } from "@/lib/rtf-html-converter";
import { and, eq, sql, inArray } from "drizzle-orm";
import crypto from "crypto";
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
      publicationYear: articles.publicationYear,
      page: articles.page,
      // Add relevance ranking when searching
      ...(text ? { rank: sql<number>`ts_rank(${articles.searchVector}, websearch_to_tsquery('spanish_unaccent', ${text}))` } : {}),
      publicationName: publications.name,
    })
    .from(articles)
    .leftJoin(publications, eq(articles.pubId, publications.id))
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

export { getIntegrantes, getTutores, getDevelopers, getIntegrantesNames, getTutoresNames, getDevelopersNames } from "./team";

const getCachedArticle = unstable_cache(
  async (id: number) => {
    const result = await db
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
        publicationName: publications.name,
      })
      .from(articles)
      .leftJoin(publications, eq(articles.pubId, publications.id))
      .where(eq(articles.id, id))
      .limit(1);
    const article = result[0];

    if (article?.content && Buffer.isBuffer(article.content)) {
      return {
        ...article,
        content: article.content.toString("base64") as unknown as Buffer,
      };
    }

    return article;
  },
  ["article-by-id-v3"],
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

const getCachedEssay = unstable_cache(
  async (id: number) => {
    const result = await db.select().from(essays).where(eq(essays.id, id)).limit(1);
    const essay = result[0];

    if (essay?.content && Buffer.isBuffer(essay.content)) {
      return {
        ...essay,
        content: essay.content.toString("base64") as unknown as Buffer,
      };
    }
    return essay;
  },
  ["essay-by-id"],
  { tags: ["essays"], revalidate: 3600 },
);

export async function getEssayById(id: number) {
  const essay = await getCachedEssay(id);
  if (!essay) return essay;

  if (typeof essay.content === "string") {
    return {
      ...essay,
      content: Buffer.from(essay.content, "base64"),
    };
  }

  /**
   * Handle Buffer deserialization from cache
   * Unstable_cache serializes Buffers to {type: 'Buffer', data: [...]} format
   */
  if (essay.content && typeof essay.content === "object" && !Buffer.isBuffer(essay.content)) {
    const obj = essay.content as { type: string; data: number[] };
    if (obj.type === "Buffer" && Array.isArray(obj.data)) {
      return {
        ...essay,
        content: Buffer.from(obj.data),
      };
    }
  }

  return essay;
}

export const getArticleMetadata = unstable_cache(
  async (id: number) => {
    const result = await db
      .select({
        id: articles.id,
        title: articles.title,
        subtitle: articles.subtitle,
        date: articles.date,
        publicationYear: articles.publicationYear,
        page: articles.page,
        columnId: articles.columnId,
        publicationName: publications.name,
      })
      .from(articles)
      .leftJoin(publications, eq(articles.pubId, publications.id))
      .where(eq(articles.id, id))
      .limit(1);
    return result[0];
  },
  ["article-metadata-by-id"],
  { tags: ["articles"], revalidate: 3600 },
);

export const getArticleHtml = unstable_cache(
  async (id: number) => {
    // Optimization: Only fetch content, not all columns
    const result = await db.select({ content: articles.content }).from(articles).where(eq(articles.id, id)).limit(1);
    const content = result[0]?.content;

    if (!content) return "";

    return processRtfContentHtml(content, id);
  },
  ["article-html-v1"],
  { tags: ["articles"], revalidate: 3600 },
);

export const getEssayMetadata = unstable_cache(
  async (id: number) => {
    const result = await db
      .select({
        id: essays.id,
        title: essays.title,
        subtitle: essays.subtitle,
        observations: essays.observations,
      })
      .from(essays)
      .where(eq(essays.id, id))
      .limit(1);
    return result[0];
  },
  ["essay-metadata-by-id"],
  { tags: ["essays"], revalidate: 3600 },
);

export async function getArticleSection(columnId: number) {
  const result = await db.select().from(publicationColumns).where(eq(publicationColumns.id, columnId)).limit(1);
  return result[0];
}

import { processRtfContent, stripHtml } from "@/lib/rtf-content-converter";

export async function getArticlesOnThisDay(day: number, month: number) {
  return await unstable_cache(
    async () => {
      // Step 1: Get matching IDs first to avoid ORDER BY RANDOM() on full dataset
      const matchingIds = await db
        .select({ id: articles.id })
        .from(articles)
        .where(sql`EXTRACT(MONTH FROM ${articles.date}) = ${month} AND EXTRACT(DAY FROM ${articles.date}) = ${day}`);

      if (matchingIds.length === 0) return [];

      // Step 2: Sample up to 10 IDs in JavaScript
      /**
       * Safe shuffle using crypto.getRandomValues() to avoid SonarCloud security hotspots
       * Math.random() is flagged as insecure for cryptographic use, though fine here.
       * We use a simple Fisher-Yates shuffle with crypto for robustness.
       */
      const shuffled = [...matchingIds];
      // eslint-disable-next-line no-restricted-syntax
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const selectedIds = shuffled.slice(0, 10).map((i) => i.id);

      // Step 3: Fetch full details for selected IDs
      const news = await db
        .select({
          id: articles.id,
          title: articles.title,
          subtitle: articles.subtitle,
          date: articles.date,
          publicationYear: articles.publicationYear,
          // Optimization: Only fetch the first 500 characters of plainText to avoid fetching large text fields
          plainText: sql<string>`substring(${articles.plainText} from 1 for 500)`,
          // Optimization: Only fetch content (bytea) if plainText is missing, to avoid transferring large blobs
          content: sql<Buffer | null>`CASE WHEN ${articles.plainText} IS NULL THEN ${articles.content} ELSE NULL END`,
          publicationName: publications.name,
        })
        .from(articles)
        .leftJoin(publications, eq(articles.pubId, publications.id))
        .where(inArray(articles.id, selectedIds));

      // Shuffle the results again to ensure random presentation order (inArray may return in ID order)
      const shuffledNews = [...news];
      // eslint-disable-next-line no-restricted-syntax
      for (let i = shuffledNews.length - 1; i > 0; i--) {
        const j = crypto.randomInt(0, i + 1);
        [shuffledNews[i], shuffledNews[j]] = [shuffledNews[j], shuffledNews[i]];
      }

      return await Promise.all(
        shuffledNews.map(async (item) => {
          const { content, plainText, ...rest } = item;
          const extract =
            plainText !== null && plainText !== undefined
              ? stripHtml(plainText).slice(0, 500)
              : await processRtfContent(content as Buffer | null, { maxLength: 500 });
          return {
            ...rest,
            extract,
          };
        }),
      );
    },
    [`articles-on-this-day-v2-${month}-${day}`],
    { revalidate: 86400 },
  )();
}
