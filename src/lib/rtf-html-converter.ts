// @ts-expect-error - rtf-to-html type definitions are missing or incomplete
import { fromString } from "@iarna/rtf-to-html";
import iconv from "iconv-lite";
import { promisify } from "util";

const rtfToHtml = promisify(fromString);

export async function processRtfContent(content: Buffer | string | null, id: number | string): Promise<string> {
  if (!content) return "Contenido no disponible";
  try {
    // Using iconv-lite to decode as Windows-1252 first to ensure 8-bit bytes are mapped to correct chars
    const contentString = Buffer.isBuffer(content) ? iconv.decode(content, "win1252") : String(content);

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

    return html;
  } catch (e) {
    console.error(`[Content ${id}] Error processing content:`, e);
    const rawContent = Buffer.isBuffer(content) ? iconv.decode(content, "win1252") : String(content);
    return `<pre>${rawContent}</pre>`;
  }
}
