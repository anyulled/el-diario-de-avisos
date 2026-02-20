import { decodeBuffer, repairMojibake, rtfToHtml, unescapeRtfHex } from "./rtf-encoding-handler";

/**
 * Strips HTML tags from a string and returns plain text
 */
export function stripHtml(html: string): string {
  return html
    .replace(/\u003c[^\u003e]*\u003e?/gm, " ")
    .replace(/&lt;[^&]*&gt;?/gm, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strips only HTML tags, preserving other whitespace characters
 */
function stripTagsOnly(text: string): string {
  return text.replace(/\u003c[^\u003e]*\u003e?/gm, " ").replace(/&lt;[^&]*&gt;?/gm, " ");
}

/**
 * Processes plain text content by cleaning up whitespace
 */
function processPlainText(text: string, preserveParagraphs: boolean): string {
  // Strip tags but keep newlines for paragraph splitting
  const stripped = stripTagsOnly(text);
  return stripped
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
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
      const cleaned = processPlainText(contentString, preserveParagraphs);
      return maxLength ? cleaned.slice(0, maxLength) : cleaned;
    }

    // Process RTF content
    const unescapedRtf = unescapeRtfHex(contentString);

    const html = await rtfToHtml(unescapedRtf, {
      template: (_doc: unknown, _defaults: unknown, content: string) => content,
    });

    const plainText = stripHtml(html);
    return maxLength ? plainText.slice(0, maxLength) : plainText;
  } catch (error) {
    // Fallback: return raw content if available, but still strip HTML
    console.debug("RTF content processing failed, using fallback:", error);
    const fallback = Buffer.isBuffer(content) ? decodeBuffer(content) : String(content);
    const result = stripHtml(fallback || "");
    return maxLength ? result.slice(0, maxLength) : result;
  }
}
