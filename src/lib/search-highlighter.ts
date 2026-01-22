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

function createSearchPattern(searchTerm: string): RegExp {
  const pattern = searchTerm
    .split("")
    .map((char) => {
      if (char === " ") {
        return "\\s+";
      }
      return createAccentInsensitivePattern(char);
    })
    .join("");

  return new RegExp(`(${pattern})`, "gi");
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

  const tagPattern = /<[^>]+>/g;
  const matches = Array.from(html.matchAll(tagPattern));

  const { parts } = matches.reduce(
    (acc, match) => {
      if (match.index !== undefined && match.index > acc.lastIndex) {
        const textContent = html.slice(acc.lastIndex, match.index);
        acc.parts.push(textContent.replace(searchPattern, "<mark>$1</mark>"));
      }
      acc.parts.push(match[0]);
      acc.lastIndex = (match.index || 0) + match[0].length;
      return acc;
    },
    { parts: [] as string[], lastIndex: 0 },
  );

  const finalLastIndex = matches.length > 0 ? (matches[matches.length - 1].index || 0) + matches[matches.length - 1][0].length : 0;
  if (finalLastIndex < html.length) {
    const textContent = html.slice(finalLastIndex);
    parts.push(textContent.replace(searchPattern, "<mark>$1</mark>"));
  }

  return parts.join("");
}
