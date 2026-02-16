import { decodeBuffer, repairMojibake, rtfToHtml, unescapeRtfHex } from "./rtf-encoding-handler";

/**
 * Strips HTML tags from a string and returns plain text.
 * Handles encoded entities (e.g., &lt;) by decoding them first.
 */
export function stripHtml(html: string): string {
  // Decode HTML entities
  const decoded = html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    // Replace &amp; last to avoid double unescaping
    .replace(/&amp;/g, "&");

  return decoded
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
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
      const cleaned = processPlainText(contentString, preserveParagraphs);
      // Ensure any HTML tags in plain text are also stripped
      const stripped = stripHtml(cleaned);
      return maxLength ? stripped.slice(0, maxLength) : stripped;
    }

    // Process RTF content
    const unescapedRtf = unescapeRtfHex(contentString);

    const html = await rtfToHtml(unescapedRtf, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      template: (_doc: any, _defaults: any, content: string) => content,
    });

    const plainText = stripHtml(html);
    return maxLength ? plainText.slice(0, maxLength) : plainText;
  } catch (error) {
    // Fallback: return raw content if available
    console.debug("RTF content processing failed, using fallback:", error);
    const fallback = Buffer.isBuffer(content) ? decodeBuffer(content) : String(content);
    const result = fallback || "";
    return maxLength ? result.slice(0, maxLength) : result;
  }
}
