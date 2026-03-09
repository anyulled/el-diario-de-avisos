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

function createAccentInsensitivePattern(char: string): string {
  const lowerChar = char.toLowerCase();
  const upperChar = char.toUpperCase();

  const baseChar = ACCENT_MAP[char];
  if (baseChar) {
    const baseLower = baseChar.toLowerCase();
    const baseUpper = baseChar.toUpperCase();
    const accentedVersions = Object.entries(ACCENT_MAP)
      .filter(([, base]) => base.toLowerCase() === baseLower)
      .map(([accented]) => accented);

    const allVersions = [baseLower, baseUpper, ...accentedVersions];
    return `[${allVersions.join("")}]`;
  }

  const accentedVersions = Object.entries(ACCENT_MAP)
    .filter(([, base]) => base.toLowerCase() === lowerChar)
    .map(([accented]) => accented);

  if (accentedVersions.length > 0) {
    const allVersions = [lowerChar, upperChar, ...accentedVersions];
    return `[${allVersions.join("")}]`;
  }

  if (lowerChar !== upperChar) {
    return `[${lowerChar}${upperChar}]`;
  }

  return char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const patternCache = new Map<string, string>();

function createSearchPattern(searchTerm: string): RegExp {
  if (patternCache.has(searchTerm)) {
    // eslint-disable-next-line no-inline-comments
    return new RegExp(`(${patternCache.get(searchTerm)})`, "gi"); // NOSONAR
  }

  const pattern = searchTerm
    .split("")
    .map((char) => {
      if (char === " ") {
        return "\\s+";
      }
      return createAccentInsensitivePattern(char);
    })
    .join("");

  /** Prevent memory leaks by limiting cache size */
  if (patternCache.size > 100) {
    const firstKey = patternCache.keys().next().value as string;
    patternCache.delete(firstKey);
  }

  patternCache.set(searchTerm, pattern);
  // eslint-disable-next-line no-inline-comments
  return new RegExp(`(${pattern})`, "gi"); // NOSONAR
}

export function highlightText(html: string, searchTerm: string): string {
  if (!searchTerm || !html) {
    return html;
  }

  const trimmedTerm = searchTerm.trim();
  if (!trimmedTerm) {
    return html;
  }

  const searchPattern = createSearchPattern(trimmedTerm);

  /**
   * Optimization: Skip HTML parsing entirely for plain text
   */
  if (html.indexOf("<") === -1) {
    // eslint-disable-next-line no-inline-comments
    return html.replace(searchPattern, "<mark>$1</mark>"); // NOSONAR
  }

  /**
   * Optimization: Use split to separate HTML tags from text.
   * The capturing group `(<[^>]+>)` ensures tags are included in the result array.
   */
  // eslint-disable-next-line no-inline-comments
  const tagPattern = /(<[^>]+>)/g; // NOSONAR
  const parts = html.split(tagPattern);

  return parts
    .map((part, index) => {
      /** Text nodes are at even indices, HTML tags at odd indices */
      if (index % 2 === 0) {
        // eslint-disable-next-line no-inline-comments
        return part.replace(searchPattern, "<mark>$1</mark>"); // NOSONAR
      }
      return part;
    })
    .join("");
}
