import { SQL } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { articles } from "@/db/schema";
import { getNewsOrderBy } from "@/lib/news-order";

const getSqlText = (orderBy: SQL) => {
  const chunks = orderBy.queryChunks as Array<{ value?: string[] }>;
  return chunks.flatMap((chunk) => chunk.value ?? []).join(" ");
};

describe("getNewsOrderBy", () => {
  it("defaults to chronological order with undated articles last", () => {
    const [orderBy] = getNewsOrderBy(null, null);

    expect(orderBy).toBeInstanceOf(SQL);

    const sqlText = getSqlText(orderBy as SQL);
    expect(sqlText).toMatch(/asc/i);
    expect(sqlText).toMatch(/nulls last/i);
  });

  it("keeps undated articles last when sorting by newest", () => {
    const [orderBy] = getNewsOrderBy("date_desc", null);

    expect(orderBy).toBeInstanceOf(SQL);

    const sqlText = getSqlText(orderBy as SQL);
    expect(sqlText).toMatch(/desc/i);
    expect(sqlText).toMatch(/nulls last/i);
  });

  it("orders by relevance when text is provided", () => {
    const [orderBy] = getNewsOrderBy("rank", "agua");

    expect(orderBy).toBeInstanceOf(SQL);

    const sqlText = getSqlText(orderBy as SQL);
    expect(sqlText).toMatch(/ts_rank/i);
    expect(sqlText).toMatch(/desc/i);
  });

  it("supports id ordering", () => {
    const [idAsc] = getNewsOrderBy("id_asc", null);
    const [idDesc] = getNewsOrderBy("id_desc", null);

    expect(idAsc).toBe(articles.id);

    const descSql = getSqlText(idDesc as SQL);
    expect(descSql).toMatch(/desc/i);
  });
});
