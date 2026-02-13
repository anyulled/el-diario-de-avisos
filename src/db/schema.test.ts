import { describe, expect, it } from "vitest";

import { articles } from "@/db/schema";

describe("schema", () => {
  it("exposes bytea columns with the correct SQL type", () => {
    expect(articles.content.getSQLType()).toBe("bytea");
  });

  it("exposes tsvector columns with the correct SQL type", () => {
    expect(articles.searchVector.getSQLType()).toBe("tsvector");
  });
});
