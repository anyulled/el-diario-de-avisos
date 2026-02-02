# Walkthrough: Article Date Extraction and Transformation

This document provides a guide for the date transformation process that fixes invalid article dates imported from the legacy Microsoft Access database.

> [!NOTE]
> For detailed architectural decisions and context, see [ADR 005: Article Date Extraction](./005-article-date-extraction.md).

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database connection configured
- Environment variables set in `.env.local`:

  ```bash
  DATABASE_URL="postgresql://user:pass@host:port/database"
  ```

## Files Involved

| File                                         | Purpose                                                    |
| -------------------------------------------- | ---------------------------------------------------------- |
| `drizzle/migrations/add_fecha_timestamp.sql` | SQL migration with column creation and extraction function |
| `scripts/transform-dates.ts`                 | TypeScript script to run migration and verify results      |
| `docs/adr/005-article-date-extraction.md`    | Architecture Decision Record                               |

## Date Transformation Results

════════════════════════════════════════════════════════════
Total articles: 21,853
Articles with extracted date: 21,747
Articles without date: 106
Success rate: 99.51%

## Step-by-Step Guide

### 1. Run Dry-Run to Verify Setup

```bash
cd web
npm run transform-dates:dry-run
```

This checks if the transformation is ready without making changes.

### 2. Execute the Transformation

```bash
npm run transform-dates
```

This will:

- Create the `extract_article_date(bytea)` PostgreSQL function.
- Add the `arti_fecha_timestamp` column.
- Populate dates by extracting from article content.
- Create an index on the new column.

### 3. Verify Sample Results

The script displays sample extractions. Verify dates match content:

| Article ID | Content Preview                    | Extracted Date |
| ---------- | ---------------------------------- | -------------- |
| 2          | "Lunes 4 de diciembre de 1837..."  | 1837-12-04     |
| 3          | "Martes 5 de diciembre de 1837..." | 1837-12-05     |
| 13         | "22 de enero de 1850..."           | 1850-01-22     |

### 4. Rename Columns (Final Step)

Once satisfied with verification, rename columns:

```bash
npm run transform-dates:rename
```

This will:

- Rename `arti_fecha` to `arti_fecha_old` (preserves original invalid data).
- Rename `arti_fecha_timestamp` to `arti_fecha` (new valid dates).

### 5. Update Drizzle Schema

Update `src/db/schema.ts` to reflect the new column types:

```typescript
export const articles = pgTable("articulos", {
  // ...
  date: timestamp("arti_fecha", { mode: "string" }),
  dateOld: varchar("arti_fecha_old", { length: 50 }),
  // ...
});
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

If extraction rate is below 80%, investigate articles without dates:

```sql
SELECT arti_cod, arti_titulo,
       substring(convert_from(arti_contenido, 'WIN1252'), 1, 200) as preview
FROM articulos
WHERE arti_fecha IS NULL
LIMIT 20;
```
