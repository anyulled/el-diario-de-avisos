-- Migration: Fix article dates where edition number was incorrectly used as year
-- Applied: 2026-01-13
-- Affected: 2,051 articles

-- This migration fixed articles where the date extraction function incorrectly
-- captured the newspaper edition number instead of the actual year (1876, 1877, etc.)

-- Stage 1: Re-apply correct dates from update_dates.sql for 1,800 articles
-- (Dates were extracted from update_dates.sql for articles with invalid years)

-- Stage 2-3: Create improved extraction function for remaining articles
CREATE OR REPLACE FUNCTION extract_valid_year(content bytea) RETURNS integer AS $$
DECLARE
  cleaned_text text;
  year_match text[];
BEGIN
  cleaned_text := strip_rtf_content(content);
  IF cleaned_text = '' THEN RETURN NULL; END IF;
  
  -- Look for month + year pattern
  year_match := regexp_match(cleaned_text, '(enero|febrero|marzo|abril|mayo|junio|julio|agosto|setiembre|septiembre|octubre|noviembre|diciembre)\s+(\d{4})', 'i');
  
  IF year_match IS NOT NULL AND year_match[2]::integer BETWEEN 1800 AND 1899 THEN
    RETURN year_match[2]::integer;
  END IF;
  
  -- Look for "de YYYY" with 18xx
  year_match := regexp_match(cleaned_text, '\bde?\s+(18\d{2})\b', 'i');
  IF year_match IS NOT NULL THEN
    RETURN year_match[1]::integer;
  END IF;
  
  -- Fallback: Find first 18xx year
  year_match := regexp_match(cleaned_text, '\b(18\d{2})\b');
  IF year_match IS NOT NULL THEN
    RETURN year_match[1]::integer;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Stage 4: Manual corrections for edge cases with typos
-- UPDATE articulos SET arti_fecha = '1877-02-14'::timestamp WHERE arti_cod = 2313;
-- UPDATE articulos SET arti_fecha = '1883-03-27'::timestamp WHERE arti_cod = 4121;
-- UPDATE articulos SET arti_fecha = '1883-09-06'::timestamp WHERE arti_cod = 4347;
-- UPDATE articulos SET arti_fecha = '1876-12-06'::timestamp WHERE arti_cod = 2249;
