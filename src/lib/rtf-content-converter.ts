import { decodeBuffer, repairMojibake, rtfToHtml, unescapeRtfHex } from "./rtf-encoding-handler";

/**
 * Strips HTML tags from a string and returns plain text
 */
export function stripHtml(html: string): string {
  // eslint-disable-next-line no-restricted-syntax
  let decoded = html;
  // eslint-disable-next-line no-restricted-syntax
  let previous = "";
  // eslint-disable-next-line no-restricted-syntax
  let iterations = 0;

  const entityMap: Record<string, string> = {
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
    "&quot;": '"',
    "&#39;": "'",
    "&#60;": "<",
    "&#62;": ">",
  };

  /**
   * Decode entities iteratively to handle double-encoding (e.g. &amp;lt;)
   * Limit iterations to prevent infinite loops
   */
  while (decoded !== previous && iterations < 5) {
    previous = decoded;
    decoded = decoded.replace(/&(?:[a-zA-Z0-9#]+);/g, (match) => {
      // Handle named entities
      if (entityMap[match]) {
        return entityMap[match];
      }
      // Handle numeric entities
      if (match.startsWith("&#")) {
        const isHex = match.startsWith("&#x") || match.startsWith("&#X");
        const code = isHex ? parseInt(match.slice(3, -1), 16) : parseInt(match.slice(2, -1), 10);
        if (!isNaN(code)) {
          return String.fromCharCode(code);
        }
      }
      return match;
    });
    iterations++;
  }

  return decoded
    .replace(/\u003c[^\u003e]*\u003e?/gm, " ")
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
      return maxLength ? cleaned.slice(0, maxLength) : cleaned;
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
