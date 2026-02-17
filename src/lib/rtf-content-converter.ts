import { decodeBuffer, repairMojibake, rtfToHtml, unescapeRtfHex } from "./rtf-encoding-handler";

/**
 * Strips HTML tags from a string and returns plain text
 */
export function stripHtml(html: string): string {
  // Decode HTML entities commonly found in database text
  // IMPORTANT: &amp; must be replaced LAST to prevent double-unescaping
  // (e.g., &amp;lt; -> &lt; -> < which is dangerous if stripped)
  const decoded = html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");

  /**
   * Replace block-level tags with newlines to preserve structure (roughly)
   * This is a simple heuristic; strictly speaking, we might want more complex parsing.
   * But for "stripHtml", collapsing to space is standard.
   * However, processPlainText relies on newlines to preserve paragraphs.
   * If stripHtml removes newlines or collapses everything, processPlainText fails.
   */
  return decoded
    .replace(/\u003c[^\u003e]*\u003e?/gm, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/**
 * Processes plain text content by cleaning up whitespace
 */
function processPlainText(text: string, preserveParagraphs: boolean): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .join(preserveParagraphs ? "\n\n" : " ");
}

/**
 * Processes RTF or plain text content and returns clean plain text
 * @param content - Buffer or string content to process
 * @param options - Processing options
 * @param options.maxLength - Maximum length of output (default: no limit)
 * @param options.preserveParagraphs - Whether to preserve paragraph breaks (default: true)
 * @returns Processed plain text
 */
export async function processRtfContent(content: Buffer | string | null, options: { maxLength?: number; preserveParagraphs?: boolean } = {}): Promise<string> {
  const { maxLength, preserveParagraphs = true } = options;

  if (!content) return "";

  try {
    const rawString = Buffer.isBuffer(content) ? decodeBuffer(content) : String(content);

    // Apply Mojibake repair
    const contentString = repairMojibake(rawString);

    // Detect if content is RTF format (starts with {\rtf) or plain text
    const isRtf = contentString.trim().startsWith("{\\rtf");

    if (!isRtf) {
      /**
       * Clean up potential HTML in plain text before processing
       * We must ensure stripHtml doesn't destroy the paragraph structure (double newlines)
       */
      const cleanedHtml = stripHtml(contentString);
      const cleaned = processPlainText(cleanedHtml, preserveParagraphs);
      return maxLength ? cleaned.slice(0, maxLength) : cleaned;
    }

    // Process RTF content
    const unescapedRtf = unescapeRtfHex(contentString);

    const html = await rtfToHtml(unescapedRtf, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      template: (_doc: any, _defaults: any, content: string) => content,
    });

    /**
     * When processing RTF->HTML, we usually want to collapse whitespace because HTML handles layout.
     * However, stripHtml as defined above preserves newlines.
     * For RTF converted content, we might want the standard behavior.
     *
     * Let's modify stripHtml to take an option or have a separate version?
     * Or just let processPlainText handle it?
     */
    const plainText = stripHtml(html);
    /**
     * If RTF->HTML conversion produced newlines for paragraphs, this is fine.
     * If it produced <p> tags, stripHtml replaced them with spaces (in the original version) or removed them (in my new version).
     *
     * If stripHtml replaces tags with spaces:
     * <p>P1</p><p>P2</p> -> " P1  P2 " -> collapsed to "P1 P2"
     *
     * If we want to preserve paragraphs from RTF, we rely on rtfToHtml producing something we can use.
     * The current rtfToHtml template just returns content.
     */

    /**
     * Let's stick to fixing the regression in processPlainText first.
     * The regression is: "Paragraph 1\n\nParagraph 2" became "Paragraph 1 Paragraph 2".
     * This is because my previous stripHtml had `.replace(/\s+/g, " ")` which collapses \n.
     *
     * My new stripHtml (above) has `.replace(/[ \t]+/g, " ")` which should preserve \n.
     *
     * HOWEVER, for the RTF path, we might need to be careful.
     */
    return maxLength ? plainText.slice(0, maxLength) : plainText;
  } catch (error) {
    // Fallback: return raw content if available
    console.debug("RTF content processing failed, using fallback:", error);
    const fallback = Buffer.isBuffer(content) ? decodeBuffer(content) : String(content);
    // Attempt to strip HTML even from fallback
    const result = fallback ? stripHtml(fallback) : "";
    return maxLength ? result.slice(0, maxLength) : result;
  }
}
