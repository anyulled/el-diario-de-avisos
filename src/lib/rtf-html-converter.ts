import { decodeBuffer, repairMojibake, rtfToHtml, unescapeRtfHex } from "./rtf-encoding-handler";

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
