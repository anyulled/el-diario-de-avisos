import { decodeBuffer, repairMojibake, rtfToHtml, unescapeRtfHex } from "./rtf-encoding-handler";

// ⚡ Bolt: Move regex instantiation to module scope to avoid recompiling on every call
// eslint-disable-next-line no-inline-comments
const FONT_SIZE_PATTERN = /\s*font-size:\s*[^;]+;?/gi; // NOSONAR
// eslint-disable-next-line no-inline-comments
const FONT_FAMILY_PATTERN = /\s*font-family:\s*[^;]+;?/gi; // NOSONAR
// eslint-disable-next-line no-inline-comments
const EMPTY_STYLE_PATTERN = /\s*style=""\s*/gi; // NOSONAR
// eslint-disable-next-line no-inline-comments
const WHITESPACE_STYLE_PATTERN = /\s*style="\s*"\s*/gi; // NOSONAR
const NEWLINE_PATTERN = /\n/g;

/**
 * Strips inline font-size and font-family styles from HTML to ensure consistent typography
 * @param html - The HTML string to process
 * @returns The HTML string with font styles removed
 */
function stripFontStyles(html: string): string {
  return (
    html
      .replace(FONT_SIZE_PATTERN, "")
      .replace(FONT_FAMILY_PATTERN, "")
      // Remove empty style attributes
      .replace(EMPTY_STYLE_PATTERN, "")
      // Remove style attributes with only whitespace
      .replace(WHITESPACE_STYLE_PATTERN, "")
  );
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
      /* Process plain text content */
      /*
       * ⚡ Bolt: Replace chained array methods (.map.filter.map.join) with a single reduce
       * to avoid allocating intermediate arrays and minimize garbage collection.
       */
      const html = contentString
        .split(/\n\s*\n/)
        .reduce((acc, p) => {
          const trimmed = p.trim();
          if (trimmed.length > 0) {
            // eslint-disable-next-line no-inline-comments
            const formatted = trimmed.replace(NEWLINE_PATTERN, "<br>"); // NOSONAR
            const paragraphHtml = `<p>${formatted}</p>`;
            return acc ? `${acc}\n${paragraphHtml}` : paragraphHtml;
          }
          return acc;
        }, "");

      return html;
    }

    // Process RTF content
    const unescapedRtf = unescapeRtfHex(contentString);

    // Allow bypassing the document structure (html/head/body) which adds unwanted margins
    const html = await rtfToHtml(unescapedRtf, {
      template: (_doc: unknown, _defaults: unknown, content: string) => content,
    });

    // Strip inline font-size and font-family styles to ensure consistent typography
    return stripFontStyles(html);
  } catch (e) {
    console.error(`[Content ${id}] Error processing content:`, e);
    const rawContent = Buffer.isBuffer(content) ? decodeBuffer(content) : String(content);
    return `<pre>${rawContent}</pre>`;
  }
}
