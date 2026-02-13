import { describe, expect, it } from "vitest";

import { decodeBytea, articles } from "@/db/schema";

describe("schema", () => {
  describe("bytea custom type", () => {
    it("should handle Buffer values", () => {
      const buf = Buffer.from("test");
      expect(decodeBytea(buf)).toBe(buf);
    });

    it("should handle string values", () => {
      expect(decodeBytea("test").toString()).toBe("test");
    });

    it("should handle DDL representation {type: 'buffer', data: [...]}", () => {
      const result = decodeBytea({ type: "buffer", data: [116, 101, 115, 116] });
      expect(result.toString()).toBe("test");
    });

    it("should handle {data: Buffer} representation", () => {
      const buf = Buffer.from("test");
      expect(decodeBytea({ data: buf })).toBe(buf);
    });

    it("should handle {data: number[]} representation", () => {
      const result = decodeBytea({ data: [116, 101, 115, 116] });
      expect(result.toString()).toBe("test");
    });

    it("should throw on unexpected types", () => {
      expect(() => decodeBytea(123)).toThrow("Unexpected bytea value type: number");
    });
  });

  it("exposes bytea columns with the correct SQL type", () => {
    expect(articles.content.getSQLType()).toBe("bytea");
  });

  it("exposes tsvector columns with the correct SQL type", () => {
    expect(articles.searchVector.getSQLType()).toBe("tsvector");
  });
});
