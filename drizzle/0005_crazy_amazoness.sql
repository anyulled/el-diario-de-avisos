-- Custom migration: Add functional index for date filtering

CREATE INDEX IF NOT EXISTS "articles_date_month_day_idx" ON "articulos" USING btree (EXTRACT(MONTH FROM "arti_fecha"),EXTRACT(DAY FROM "arti_fecha"));

-- Rollback:
-- DROP INDEX IF EXISTS "articles_date_month_day_idx";
