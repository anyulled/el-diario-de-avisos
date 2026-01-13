# ADR 005: Article Date Extraction and Transformation

## Context

The original data comes from a Microsoft Access database created 20+ years ago. When using `mdb-tools` to extract data, the `Arti_Fecha` column (article dates) was corrupted, resulting in invalid dates like `01/00/00 00:00:00` or `1900-01-00 00:00:00` being exported.

Analysis revealed that:

1. **mdb-tools exports invalid dates**: All date values were corrupted with unreal values (e.g., day `00`, year `1900`).
2. **Actual dates exist in article content**: The real publication dates are embedded in the `arti_contenido` field in Spanish format (e.g., "Sábado 2 de diciembre de 1837").
3. **Workaround in place**: We initially changed the `arti_fecha` column from `TIMESTAMP` to `VARCHAR(50)` to allow data import, but this degraded user experience for date-based operations.

## Decision

We decided to implement a date extraction and transformation strategy:

### 1. PostgreSQL Date Extraction Function

Created a function `extract_article_date(bytea)` that implements robust and fuzzy extraction logic:

- **Decodes content**: Converts from Windows-1252 to UTF-8.
- **Sanitizes RTF**: Explicitly replaces RTF hex sequences (e.g., `\'e9` → `é`) and strips control words.
- **Fuzzy Pattern Matching**: Uses regex to find dates with:
  - **Archaic spellings**: "setiembre" (matches `septiembre`).
  - **Common typos**: "cotubre" (octubre), "abirl" (abril).
  - **Loose spacing**: Matches dates even with intervening characters (up to 12 chars).
  - **Formats**: Supports `DD de MONTH de YYYY`, `MONTH DD YYYY`, and `MONTH YYYY` (defaulting to day 1).
- **Date Construction**: Maps month names (including archaic/typo variants) to unaccented integers and constructs a valid `TIMESTAMP`.

### 2. Data Migration Strategy

Instead of destructive migration:

1. **Added new column**: `arti_fecha_timestamp` (nullable `TIMESTAMP WITHOUT TIME ZONE`).
2. **Populated via extraction**: Used the extraction function to populate dates from article content.
3. **Verified success rate**: Achieved 91.48% success (9,067 of 9,911 articles).
4. **Renamed columns**:
   - `arti_fecha` → `arti_fecha_old` (preserves original invalid data)
   - `arti_fecha_timestamp` → `arti_fecha` (new valid dates)

### 3. Schema Updates

Updated the Drizzle ORM schema to:

- Change `date` field from `varchar` to `timestamp` (nullable).
- Add `dateOld` field to reference the original invalid data if needed.

## Consequences

### Pros

- **Data integrity restored**: 91.48% of articles now have valid, queryable timestamps.
- **Date-based queries enabled**: Applications can now perform date range filtering, sorting, and aggregation.
- **Data preservation**: Original (invalid) dates preserved in `arti_fecha_old` for auditing.
- **Reproducible process**: Script can be re-run if source data changes.

### Cons

- **~8.5% null dates**: 844 articles have no extractable date (content may not contain date information or uses non-standard format).
- **Maintenance burden**: Date extraction function relies on Spanish language patterns.
- **Index overhead**: Additional index on date column consumes storage.

## Verification

The transformation was verified by:

1. Confirming mdb-tools exports invalid dates (tested with `mdb-export` command).
2. Running dry-run transformation to validate extraction logic.
3. Sampling extracted dates against article content.
4. Comparing success rate (91.48%).

Sample extractions:

- Article #2: Content "Lunes 4 de diciembre de 1837" → `1837-12-04`
- Article #3: Content "Martes 5 de diciembre de 1837" → `1837-12-05`
- Article #13: Content "22 de enero de 1850" → `1850-01-22`

## Status

Accepted. Implemented on 2026-01-07.

---

## Update: Edition Number Confusion Fix (2026-01-13)

### Issue Discovered

44 articles (IDs 2927-2971) from 1879 had incorrect dates where the **edition number (Número)** was captured instead of the actual year.

**Example:**

```
Content: "Sábado 15 de noviembre de 1879. ( Año VII, Mes 7, Número 1897)"
Extracted: 1897-11-15 ❌ (edition number)
Correct:   1879-11-15 ✓
```

### Root Cause

The original regex `.*?(\\d{4})` was too lenient, allowing the pattern to skip over the year (1879) and capture the edition number (1897) instead.

### Fix Applied

1. **Stricter regex patterns**: Updated `extract_article_date` to prioritize the year immediately after `de [month] de` with only whitespace allowed between.
2. **Explicit lookahead**: Year must be followed by period, space, or parenthesis to prevent matching edition numbers.
3. **Pattern priority**: Strict patterns tried first, relaxed patterns as fallback.

### Migration

Applied via [fix_edition_number_dates.sql](file:///Users/anyulled/Downloads/El%20Diario%20de%20Avisos/web/drizzle/migrations/fix_edition_number_dates.sql):

- Fixed 44 affected articles
- Updated `extract_article_date` function

### Lesson Learned

When extracting dates from structured content, be aware of **metadata patterns** (like edition numbers) that may contain valid-looking years. Use stricter boundary conditions and verify extracted years against expected publication date ranges.
