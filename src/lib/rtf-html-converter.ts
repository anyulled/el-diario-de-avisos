// @ts-expect-error - rtf-to-html type definitions are missing or incomplete
import { fromString } from "@iarna/rtf-to-html";
import iconv from "iconv-lite";
import { promisify } from "util";

const rtfToHtml = promisify(fromString);

/**
 * Strips inline font-size and font-family styles from HTML to ensure consistent typography
 * @param html - The HTML string to process
 * @returns The HTML string with font styles removed
 */
function stripFontStyles(html: string): string {
  return (
    html
      .replace(/\s*font-size:\s*[^;]+;?/gi, "")
      .replace(/\s*font-family:\s*[^;]+;?/gi, "")
      // Remove empty style attributes
      .replace(/\s*style=""\s*/gi, "")
      // Remove style attributes with only whitespace
      .replace(/\s*style="\s*"\s*/gi, "")
  );
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

export async function processRtfContent(content: Buffer | string | null, id: number | string): Promise<string> {
  if (!content) return "Contenido no disponible";

  // Defensive check: ensure content is not an object
  if (typeof content === "object" && !Buffer.isBuffer(content)) {
    console.error(`[Content ${id}] Received object instead of Buffer/string:`, content);
    return "Error: contenido no válido";
  }

  try {
    // Determine encoding (UTF-8 vs Win1252) and handle Mojibake
    const rawString = Buffer.isBuffer(content) ? decodeBuffer(content) : String(content);
    const contentString = repairMojibake(rawString);

    // Detect if content is RTF format (starts with {\rtf) or plain text
    const isRtf = contentString.trim().startsWith("{\\rtf");

    if (!isRtf) {
      // Process plain text content
      const paragraphs = contentString
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const html = paragraphs
        .map((p) => {
          const formatted = p.replace(/\n/g, "<br>");
          return `<p>${formatted}</p>`;
        })
        .join("\n");

      return html;
    }

    /*
     * Process RTF content
     * HACK: Manually unescape RTF hex sequences for Latin1 characters (\'xx)
     */
    const unescapedRtf = contentString.replace(/\\'([0-9a-fA-F]{2})/g, (match, hex) => {
      const code = parseInt(hex, 16);
      /*
       * Only decode extended ASCII range (128-255).
       * Standard ASCII escapes (if any) might be handled slightly differently or not occur as \'xx often.
       */
      if (code >= 0x80 && code <= 0xff) {
        return String.fromCharCode(code);
      }
      return match;
    });

    // Allow bypassing the document structure (html/head/body) which adds unwanted margins
    const html = await rtfToHtml(unescapedRtf, {
      template: (_doc: unknown, _defaults: unknown, content: string) => content,
    });

    // Strip inline font-size and font-family styles to ensure consistent typography
    return stripFontStyles(html);
  } catch (e) {
    console.error(`[Content ${id}] Error processing content:`, e);
    const rawContent = Buffer.isBuffer(content) ? iconv.decode(content, "win1252") : String(content);
    return `<pre>${rawContent}</pre>`;
  }
}
