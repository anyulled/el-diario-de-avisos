/**
 * Page Extractor Utility
 *
 * Extracts page references from article RTF content.
 * Supports patterns like: (p.4), (P. 3), (P. 3 y 4), (P. 3, 4 y 5)
 */

export interface PageExtractionResult {
  pages: string | null;
  matched: boolean;
  pattern?: string;
}

/**
 * Extracts page reference from RTF content
 * @param content - RTF content as Buffer or string
 * @returns Extracted page reference or null
 */
export function extractPageReference(content: Buffer | string | null): PageExtractionResult {
  if (!content) {
    return { pages: null, matched: false };
  }

  // eslint-disable-next-line no-restricted-syntax -- let is necessary for try-catch assignment
  let text: string;
  try {
    if (Buffer.isBuffer(content)) {
      // Try decoding as WIN1252 (common for RTF) or UTF-8
      text = content.toString("latin1");
    } else {
      text = content;
    }
  } catch {
    return { pages: null, matched: false };
  }

  // Pattern 1: (p.3 y 4) or (P. 3 y 4) - page range with "y"
  const rangeWithY = /\(p\.?\s*(\d+)\s+y\s+(\d+)\)/i;
  const match1 = text.match(rangeWithY);
  if (match1) {
    const [, start, end] = match1;
    return { pages: `${start}-${end}`, matched: true, pattern: "range_y" };
  }

  // Pattern 2: (p.3 & 4) or (P. 3 & 4) - page range with "&"
  const rangeWithAmpersand = /\(p\.?\s*(\d+)\s+&\s+(\d+)\)/i;
  const match2 = text.match(rangeWithAmpersand);
  if (match2) {
    const [, start, end] = match2;
    return { pages: `${start}-${end}`, matched: true, pattern: "range_ampersand" };
  }

  // Pattern 3: (P. 3, 4 y 5) - multiple pages with commas and "y"
  const multiplePages = /\(p\.?\s*(\d+(?:\s*,\s*\d+)*)\s+y\s+(\d+)\)/i;
  const match3 = text.match(multiplePages);
  if (match3) {
    const [, pageList, lastPage] = match3;
    const pages = pageList.split(",").map((p) => p.trim());
    pages.push(lastPage);
    return { pages: pages.join(", "), matched: true, pattern: "multiple_y" };
  }

  // Pattern 4: (p.4) or (P. 4) - single page
  const singlePage = /\(p\.?\s*(\d+)\)/i;
  const match4 = text.match(singlePage);
  if (match4) {
    const [, page] = match4;
    return { pages: page, matched: true, pattern: "single" };
  }

  return { pages: null, matched: false };
}

/**
 * Normalizes page reference for consistent display
 * @param pages - Page reference string
 * @returns Normalized page reference
 */
export function normalizePageReference(pages: string | null): string {
  if (!pages) return "No especificada";
  return pages;
}
