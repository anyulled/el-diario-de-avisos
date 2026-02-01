import iconv from "iconv-lite";
// @ts-expect-error - rtf-to-html type definitions are missing
import { fromString } from "@iarna/rtf-to-html";
import { promisify } from "util";

const rtfToHtml = promisify(fromString);

/**
 * Strips HTML tags from a string and returns plain text
 */
export function stripHtml(html: string): string {
  return html
    .replace(/\u003c[^\u003e]*\u003e?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Unescapes RTF hex sequences (e.g., \\'e1 -> á)
 */
function unescapeRtfHex(rtfContent: string): string {
  return rtfContent.replace(/\\'([0-9a-fA-F]{2})/g, (match, hex) => {
    const code = parseInt(hex, 16);
    return code >= 0x80 && code <= 0xff ? String.fromCharCode(code) : match;
  });
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
 * Attempts to repair Double-Encoded UTF-8 (Mojibake) where UTF-8 bytes were read as Latin1.
 * Pattern: "Ã" (\u00C3) followed by characters in the range \u0080-\u00BF
 */
function repairMojibake(text: string): string {
  if (text.match(/\u00C3[\u0080-\u00BF]/)) {
    try {
      const repaired = Buffer.from(text, "binary").toString("utf8");
      // Only use repaired version if it didn't introduce new errors
      if (!repaired.includes("\ufffd")) {
        return repaired;
      }
    } catch {
      // Ignore errors and return original
    }
  }
  return text;
}

/**
 * Decodes a buffer trying UTF-8 first, falling back to Windows-1252.
 */
function decodeBuffer(buffer: Buffer): string {
  // Try UTF-8 first
  const utf8 = buffer.toString("utf8");

  // If it contains the replacement character, it's likely not valid UTF-8, so try windows-1252
  if (utf8.includes("\ufffd")) {
    return iconv.decode(buffer, "win1252");
  }

  return utf8;
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
    const fallback = Buffer.isBuffer(content) ? iconv.decode(content, "win1252") : String(content);
    const result = fallback || "";
    return maxLength ? result.slice(0, maxLength) : result;
  }
}
