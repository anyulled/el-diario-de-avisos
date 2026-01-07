# Walkthrough: Article Date Extraction and Transformation

This document provides a step-by-step guide for the date transformation process that fixes invalid article dates imported from the legacy Microsoft Access database.

## Problem Statement

The `mdb-tools` utility failed to properly extract dates from the Microsoft Access database, resulting in all article dates being invalid (e.g., `01/00/00 00:00:00`, `1900-01-00 00:00:00`). The actual dates are embedded within the article content in Spanish format.

## Solution Overview

We extract valid dates from the article content (`arti_contenido`) using a PostgreSQL function that:

1. Decodes the content from Windows-1252 encoding
2. Strips RTF formatting
3. Searches for Spanish date patterns (e.g., "6 de febrero de 1874")
4. Constructs valid timestamps

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database connection configured
- Environment variables set in `.env.local`:

  ```bash
  DATABASE_URL="postgresql://user:pass@host:port/database"
  ```

## Files Created

| File                                         | Purpose                                                    |
| -------------------------------------------- | ---------------------------------------------------------- |
| `drizzle/migrations/add_fecha_timestamp.sql` | SQL migration with column creation and extraction function |
| `scripts/transform-dates.ts`                 | TypeScript script to run migration and verify results      |
| `docs/adr/005-article-date-extraction.md`    | Architecture Decision Record                               |

## Step-by-Step Guide

### 1. Verify mdb-tools Date Export Issue

First, confirm that mdb-tools is exporting invalid dates:

```bash
cd /path/to/project
mdb-export -D '%Y-%m-%d %H:%M:%S' data/Tesis-Campomas-Santana.MDB Articulos | head -5
```

Expected output shows dates like `01/00/00 00:00:00`.

### 2. Run Dry-Run to Verify Setup

```bash
cd web
npm run transform-dates:dry-run
```

This checks if the transformation is ready without making changes.

### 3. Execute the Transformation

```bash
npm run transform-dates
```

This will:

- Create the `extract_article_date(bytea)` PostgreSQL function
- Add the `arti_fecha_timestamp` column
- Populate dates by extracting from article content
- Create an index on the new column

Expected output:

```
📅 Date Transformation Script
────────────────────────────────────────────────────────────
Running date transformation migration...
✓ Migration executed successfully

📊 Verifying transformation...

════════════════════════════════════════════════════════════
Date Transformation Results
════════════════════════════════════════════════════════════
Total articles:                9,911
Articles with extracted date:  9,067
Articles without date:         844
Success rate:                  91.48%
```

### 4. Verify Sample Results

The script displays sample extractions. Verify dates match content:

| Article ID | Content Preview                    | Extracted Date |
| ---------- | ---------------------------------- | -------------- |
| 2          | "Lunes 4 de diciembre de 1837..."  | 1837-12-04     |
| 3          | "Martes 5 de diciembre de 1837..." | 1837-12-05     |
| 13         | "22 de enero de 1850..."           | 1850-01-22     |

### 5. Rename Columns (Final Step)

Once satisfied with verification, rename columns:

```bash
npm run transform-dates:rename
```

This will:

- Rename `arti_fecha` to `arti_fecha_old` (preserves original invalid data)
- Rename `arti_fecha_timestamp` to `arti_fecha` (new valid dates)

### 6. Update Drizzle Schema

The schema (`src/db/schema.ts`) needs updating to reflect the new column types:

```typescript
export const articles = pgTable("articulos", {
  // ...other fields
  date: timestamp("arti_fecha", { mode: "string" }),
  dateOld: varchar("arti_fecha_old", { length: 50 }),
  // ...other fields
});
```

### 7. Rebuild the Application

```bash
npm run build
npm run test
```

## Scripts Reference

| Script                            | Purpose                          |
| --------------------------------- | -------------------------------- |
| `npm run transform-dates`         | Run migration and show results   |
| `npm run transform-dates:dry-run` | Preview without making changes   |
| `npm run transform-dates:rename`  | Run migration AND rename columns |

## Troubleshooting

### "Column already exists" Error

This is safe to ignore - the migration is idempotent.

### Low Success Rate (<80%)

If extraction rate is below 80%:

1. Analyze articles without dates
2. Check if content format differs
3. Consider extending the regex pattern

Query to investigate articles without dates:

```sql
SELECT arti_cod, arti_titulo,
       substring(convert_from(arti_contenido, 'WIN1252'), 1, 200) as preview
FROM articulos
WHERE arti_fecha IS NULL
LIMIT 20;
```

### Encoding Errors

If you see encoding errors, the content may use a different charset. The function falls back to LATIN1 if WIN1252 fails.

## PostgreSQL Function Reference

The `extract_article_date(bytea)` function can be used directly in queries:

```sql
-- Extract date from any article
SELECT arti_cod, extract_article_date(arti_contenido) as extracted_date
FROM articulos
WHERE arti_cod = 123;

-- Find articles with dates in a specific range
SELECT arti_cod, arti_titulo, arti_fecha
FROM articulos
WHERE arti_fecha BETWEEN '1850-01-01' AND '1850-12-31'
ORDER BY arti_fecha;
```

## Rollback Procedure

If needed, revert the column rename:

```sql
ALTER TABLE articulos RENAME COLUMN arti_fecha TO arti_fecha_timestamp;
ALTER TABLE articulos RENAME COLUMN arti_fecha_old TO arti_fecha;
```

Then update the Drizzle schema back to `varchar`.

## Related Documentation

- [ADR 003: Legacy Data Encoding (Windows-1252) & RTF](./adr/003-legacy-data-encoding-rtf.md)
- [ADR 005: Article Date Extraction](./adr/005-article-date-extraction.md)
