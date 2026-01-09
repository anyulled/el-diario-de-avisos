import { desc, sql } from "drizzle-orm";

import { articles } from "@/db/schema";

const dateOrder = (direction: "ASC" | "DESC") => (direction === "ASC" ? sql`${articles.date} ASC NULLS LAST` : sql`${articles.date} DESC NULLS LAST`);

export const getNewsOrderBy = (sort: string | null | undefined, text: string | null | undefined) => {
  switch (sort) {
    case "date_asc":
      return [dateOrder("ASC")];
    case "date_desc":
      return [dateOrder("DESC")];
    case "id_asc":
      return [articles.id];
    case "id_desc":
      return [desc(articles.id)];
    case "rank":
      return text ? [sql`ts_rank(${articles.searchVector}, websearch_to_tsquery('spanish_unaccent', ${text})) DESC`] : [dateOrder("ASC")];
    default:
      return [dateOrder("ASC")];
  }
};
