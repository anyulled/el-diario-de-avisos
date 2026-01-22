import { describe, expect, it } from "vitest";
import { highlightText } from "./search-highlighter";

describe("highlightText", () => {
  it("should return original HTML when search term is empty", () => {
    const html = "<p>Hello world</p>";
    expect(highlightText(html, "")).toBe(html);
    expect(highlightText(html, "   ")).toBe(html);
  });

  it("should return original HTML when HTML is empty", () => {
    expect(highlightText("", "test")).toBe("");
  });

  it("should highlight exact matches", () => {
    const html = "<p>Hello world</p>";
    const result = highlightText(html, "world");
    expect(result).toBe("<p>Hello <mark>world</mark></p>");
  });

  it("should be case insensitive", () => {
    const html = "<p>Hello World</p>";
    const result = highlightText(html, "world");
    expect(result).toBe("<p>Hello <mark>World</mark></p>");
  });

  it("should handle accented characters when searching with unaccented term", () => {
    const html = "<p>El café está cerrado</p>";
    const result = highlightText(html, "cafe");
    expect(result).toBe("<p>El <mark>café</mark> está cerrado</p>");
  });

  it("should handle accented characters when searching with accented term", () => {
    const html = "<p>El cafe esta cerrado</p>";
    const result = highlightText(html, "café");
    expect(result).toBe("<p>El <mark>cafe</mark> esta cerrado</p>");
  });

  it("should handle multiple accented characters", () => {
    const html = "<p>La cancelación fue aprobada</p>";
    const result = highlightText(html, "cancelacion");
    expect(result).toBe("<p>La <mark>cancelación</mark> fue aprobada</p>");
  });

  it("should highlight phrases with multiple words", () => {
    const html = "<p>La hija del Guaire es famosa</p>";
    const result = highlightText(html, "hija del Guaire");
    expect(result).toBe("<p>La <mark>hija del Guaire</mark> es famosa</p>");
  });

  it("should handle phrases with accents", () => {
    const html = "<p>La niña del río es famosa</p>";
    const result = highlightText(html, "nina del rio");
    expect(result).toBe("<p>La <mark>niña del río</mark> es famosa</p>");
  });

  it("should highlight multiple occurrences", () => {
    const html = "<p>café café café</p>";
    const result = highlightText(html, "cafe");
    expect(result).toBe("<p><mark>café</mark> <mark>café</mark> <mark>café</mark></p>");
  });

  it("should not highlight inside HTML tags", () => {
    const html = '<p class="world">Hello world</p>';
    const result = highlightText(html, "world");
    expect(result).toBe('<p class="world">Hello <mark>world</mark></p>');
  });

  it("should preserve HTML structure with nested tags", () => {
    const html = "<div><p>El <strong>café</strong> está cerrado</p></div>";
    const result = highlightText(html, "cafe");
    expect(result).toBe("<div><p>El <strong><mark>café</mark></strong> está cerrado</p></div>");
  });

  it("should handle special characters in search term", () => {
    const html = "<p>Cost is $100</p>";
    const result = highlightText(html, "$100");
    expect(result).toBe("<p>Cost is <mark>$100</mark></p>");
  });

  it("should handle ñ character", () => {
    const html = "<p>El niño está jugando</p>";
    const result = highlightText(html, "nino");
    expect(result).toBe("<p>El <mark>niño</mark> está jugando</p>");
  });

  it("should handle mixed case in phrases", () => {
    const html = "<p>La Hija Del Guaire es famosa</p>";
    const result = highlightText(html, "hija del guaire");
    expect(result).toBe("<p>La <mark>Hija Del Guaire</mark> es famosa</p>");
  });

  it("should handle extra whitespace in content", () => {
    const html = "<p>La  hija   del    Guaire</p>";
    const result = highlightText(html, "hija del Guaire");
    expect(result).toBe("<p>La  <mark>hija   del    Guaire</mark></p>");
  });

  it("should handle complex HTML with multiple paragraphs", () => {
    const html = "<p>First café</p><p>Second café</p>";
    const result = highlightText(html, "cafe");
    expect(result).toBe("<p>First <mark>café</mark></p><p>Second <mark>café</mark></p>");
  });
});
