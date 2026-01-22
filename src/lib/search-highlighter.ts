/**
 * Accent-insensitive search highlighter for HTML content
 * Supports both single words and phrases (e.g., "hija del Guaire")
 */

/**
 * Creates a mapping of accented characters to their base forms
 */
const ACCENT_MAP: Record<string, string> = {
  á: "a",
  à: "a",
  ä: "a",
  â: "a",
  é: "e",
  è: "e",
  ë: "e",
  ê: "e",
  í: "i",
  ì: "i",
  ï: "i",
  î: "i",
  ó: "o",
  ò: "o",
  ö: "o",
  ô: "o",
  ú: "u",
  ù: "u",
  ü: "u",
  û: "u",
  ñ: "n",
  Á: "A",
  À: "A",
  Ä: "A",
  Â: "A",
  É: "E",
  È: "E",
  Ë: "E",
  Ê: "E",
  Í: "I",
  Ì: "I",
  Ï: "I",
  Î: "I",
  Ó: "O",
  Ò: "O",
  Ö: "O",
  Ô: "O",
  Ú: "U",
  Ù: "U",
  Ü: "U",
  Û: "U",
  Ñ: "N",
};

/**
 * Creates a regex pattern that matches a character with or without accents
 */
function createAccentInsensitivePattern(char: string): string {
  const lowerChar = char.toLowerCase();
  const upperChar = char.toUpperCase();

  // Check if this character is an accented character
  const baseChar = ACCENT_MAP[char];
  if (baseChar) {
    // This is an accented character, find all variants including the base
    const baseLower = baseChar.toLowerCase();
    const baseUpper = baseChar.toUpperCase();
    const accentedVersions = Object.entries(ACCENT_MAP)
      .filter(([, base]) => base.toLowerCase() === baseLower)
      .map(([accented]) => accented);

    const allVersions = [baseLower, baseUpper, ...accentedVersions];
    return `[${allVersions.join("")}]`;
  }

  // Find all accented versions of this base character
  const accentedVersions = Object.entries(ACCENT_MAP)
    .filter(([, base]) => base.toLowerCase() === lowerChar)
    .map(([accented]) => accented);

  if (accentedVersions.length > 0) {
    // Include the base character and all accented versions
    const allVersions = [lowerChar, upperChar, ...accentedVersions];
    return `[${allVersions.join("")}]`;
  }

  // For non-accentable characters, just match case-insensitively
  if (lowerChar !== upperChar) {
    return `[${lowerChar}${upperChar}]`;
  }

  // For special characters, escape them
  return char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Creates a regex pattern from a search term that matches accent-insensitively
 */
function createSearchPattern(searchTerm: string): RegExp {
  // Split the search term into words to handle phrases
  const pattern = searchTerm
    .split("")
    .map((char) => {
      if (char === " ") {
        // Match one or more whitespace characters
        return "\\s+";
      }
      return createAccentInsensitivePattern(char);
    })
    .join("");

  return new RegExp(`(${pattern})`, "gi");
}

/**
 * Highlights search terms in HTML content while preserving HTML structure
 * @param html - The HTML content to highlight
 * @param searchTerm - The search term (can be a phrase like "hija del Guaire")
 * @returns HTML with highlighted search terms
 */
export function highlightText(html: string, searchTerm: string): string {
  if (!searchTerm || !html) {
    return html;
  }

  const trimmedTerm = searchTerm.trim();
  if (!trimmedTerm) {
    return html;
  }

  const searchPattern = createSearchPattern(trimmedTerm);

  // Split HTML into tags and text nodes
  const tagPattern = /<[^>]+>/g;
  const matches = Array.from(html.matchAll(tagPattern));

  const { parts } = matches.reduce(
    (acc, match) => {
      // Add text before the tag
      if (match.index !== undefined && match.index > acc.lastIndex) {
        const textContent = html.slice(acc.lastIndex, match.index);
        acc.parts.push(textContent.replace(searchPattern, "<mark>$1</mark>"));
      }
      // Add the tag itself (unchanged)
      acc.parts.push(match[0]);
      acc.lastIndex = (match.index || 0) + match[0].length;
      return acc;
    },
    { parts: [] as string[], lastIndex: 0 },
  );

  // Add remaining text after the last tag
  const finalLastIndex = matches.length > 0 ? (matches[matches.length - 1].index || 0) + matches[matches.length - 1][0].length : 0;
  if (finalLastIndex < html.length) {
    const textContent = html.slice(finalLastIndex);
    parts.push(textContent.replace(searchPattern, "<mark>$1</mark>"));
  }

  return parts.join("");
}
