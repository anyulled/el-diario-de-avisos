-- Migration: Remove redundant arti_fecha_timestamp column
-- Context: This column was part of a migration that was never fully completed.
-- The column should have been renamed to arti_fecha, but both columns exist.
-- ADR: 005-article-date-extraction.md

-- Drop the redundant column
ALTER TABLE articulos DROP COLUMN IF EXISTS arti_fecha_timestamp;

-- Drop the associated index if it exists
DROP INDEX IF EXISTS idx_articulos_fecha_timestamp;
