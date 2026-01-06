"use server";

import { db } from "@/db";
import { articles, members, publicationColumns, tutors } from "@/db/schema";
import { and, desc, eq, like, or } from "drizzle-orm";

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
  if (text) {
    conditions.push(
      or(
        like(articles.title, `%${text}%`),
        like(articles.subtitle, `%${text}%`),
        like(articles.content, `%${text}%`),
      ),
    );
  }

  const query = db
    .select()
    .from(articles)
    .where(and(...conditions))
    .orderBy(desc(articles.date))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return await query;
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
