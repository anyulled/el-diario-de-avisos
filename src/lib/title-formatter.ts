/**
 * Formats article titles for display in the GUI.
 *
 * Cleans up titles that follow the pattern:
 * "(Sin Título) DIARIO DE AVISOS YYYY.rtf, Articulo #XXXX"
 *
 * @param title - The raw article title from the database
 * @returns Formatted title for display
 *
 * @example
 * formatArticleTitle("(Sin Título) DIARIO DE AVISOS 1878.rtf, Articulo #2548")
 * // Returns: "Artículo #2548"
 *
 * @example
 * formatArticleTitle("La Guerra de Independencia")
 * // Returns: "La Guerra de Independencia"
 */
export function formatArticleTitle(title: string | null | undefined): string {
  // Handle null, undefined, or empty strings
  if (!title || title.trim() === "") {
    return "Sin Título";
  }

  /*
   * Pattern to match: (Sin Título) DIARIO DE AVISOS YYYY.rtf, Articulo #XXXX
   * Case-insensitive matching for flexibility
   */
  const pattern = /\(Sin Título\).*Articulo #(\d+)/i;
  const match = title.match(pattern);

  if (match && match[1]) {
    // Extract the article number and format it
    return `Artículo #${match[1]}`;
  }

  // Return original title if it doesn't match the pattern
  return title;
}
