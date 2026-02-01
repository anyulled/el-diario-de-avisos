import iconv from "iconv-lite";
// @ts-expect-error - rtf-to-html type definitions are missing or incomplete
import { fromString } from "@iarna/rtf-to-html";
import { promisify } from "util";

export const rtfToHtml = promisify(fromString);

/**
 * Attempts to repair Double-Encoded UTF-8 (Mojibake) where UTF-8 bytes were read as Latin1.
 * Pattern: "Ã" (\u00C3) followed by characters in the range \u0080-\u00BF
 */
export function repairMojibake(text: string): string {
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
export function decodeBuffer(buffer: Buffer): string {
  // Try UTF-8 first
  const utf8 = buffer.toString("utf8");

  // If it contains the replacement character, it's likely not valid UTF-8, so try windows-1252
  if (utf8.includes("\ufffd")) {
    return iconv.decode(buffer, "win1252");
  }

  return utf8;
}

/**
 * Unescapes RTF hex sequences (e.g., \\'e1 -> á)
 */
export function unescapeRtfHex(rtfContent: string): string {
  return rtfContent.replace(/\\'([0-9a-fA-F]{2})/g, (match, hex) => {
    const code = parseInt(hex, 16);
    // Only decode extended ASCII range (128-255).
    if (code >= 0x80 && code <= 0xff) {
      return String.fromCharCode(code);
    }
    return match;
  });
}
