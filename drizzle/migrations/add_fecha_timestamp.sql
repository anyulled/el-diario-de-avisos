-- Migration: Add arti_fecha_timestamp column and date extraction function
-- Purpose: Transform invalid MDB-exported dates to proper timestamps by extracting
--          actual dates from article content (arti_contenido)

-- Step 1: Add the new timestamp column (nullable)
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS arti_fecha_timestamp TIMESTAMP WITHOUT TIME ZONE;

-- Step 2: Create function to extract Spanish dates from article content
-- Pattern: "DD de MONTH de YYYY" (e.g., "6 de febrero de 1874")
CREATE OR REPLACE FUNCTION extract_article_date(content bytea) RETURNS timestamp AS $$
DECLARE
  decoded_text text;
  cleaned_text text;
  date_match text[];
  day_str text;
  month_str text;
  year_str text;
  month_num integer;
  result_date date;
BEGIN
  -- Return NULL if content is null
  IF content IS NULL THEN
    RETURN NULL;
  END IF;

  -- Decode from Windows-1252 encoding
  BEGIN
    decoded_text := convert_from(content, 'WIN1252');
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to LATIN1 if WIN1252 fails
    BEGIN
      decoded_text := convert_from(content, 'LATIN1');
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL;
    END;
  END;

  -- Check if content is RTF, clean it first
  IF decoded_text ~ '^\s*\{\\rtf' THEN
    -- Convert RTF hex sequences for accented vowels
    cleaned_text := regexp_replace(decoded_text, E'\\\\''e1', 'á', 'g');
    cleaned_text := regexp_replace(cleaned_text, E'\\\\''e9', 'é', 'g');
    cleaned_text := regexp_replace(cleaned_text, E'\\\\''ed', 'í', 'g');
    cleaned_text := regexp_replace(cleaned_text, E'\\\\''f3', 'ó', 'g');
    cleaned_text := regexp_replace(cleaned_text, E'\\\\''fa', 'ú', 'g');
    cleaned_text := regexp_replace(cleaned_text, E'\\\\''f1', 'ñ', 'g');
    
    -- Strip RTF control words
    cleaned_text := regexp_replace(cleaned_text, '\\[a-z]+(-?[0-9]+)?', '', 'g');
    cleaned_text := regexp_replace(cleaned_text, E'\\\\''[0-9a-fA-F]{2}', '', 'g');
    cleaned_text := regexp_replace(cleaned_text, '[{}\\]', '', 'g');
  ELSE
    cleaned_text := decoded_text;
  END IF;

  -- Convert to lowercase for matching
  cleaned_text := lower(cleaned_text);

  -- Match pattern: DD de MONTH de YYYY
  -- Using regex to capture: day, month name, year
  date_match := regexp_match(
    cleaned_text,
    '(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})',
    'i'
  );

  IF date_match IS NULL THEN
    RETURN NULL;
  END IF;

  day_str := date_match[1];
  month_str := date_match[2];
  year_str := date_match[3];

  -- Convert month name to number
  month_num := CASE lower(month_str)
    WHEN 'enero' THEN 1
    WHEN 'febrero' THEN 2
    WHEN 'marzo' THEN 3
    WHEN 'abril' THEN 4
    WHEN 'mayo' THEN 5
    WHEN 'junio' THEN 6
    WHEN 'julio' THEN 7
    WHEN 'agosto' THEN 8
    WHEN 'septiembre' THEN 9
    WHEN 'setiembre' THEN 9  -- Alternative spelling
    WHEN 'octubre' THEN 10
    WHEN 'noviembre' THEN 11
    WHEN 'diciembre' THEN 12
    ELSE NULL
  END;

  IF month_num IS NULL THEN
    RETURN NULL;
  END IF;

  -- Construct date
  BEGIN
    result_date := make_date(year_str::integer, month_num, day_str::integer);
    RETURN result_date::timestamp;
  EXCEPTION WHEN OTHERS THEN
    -- Invalid date (e.g., Feb 30)
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Populate arti_fecha_timestamp by extracting dates from content
UPDATE articulos 
SET arti_fecha_timestamp = extract_article_date(arti_contenido)
WHERE arti_fecha_timestamp IS NULL;

-- Step 4: Create index on the new timestamp column for date-based queries
CREATE INDEX IF NOT EXISTS idx_articulos_fecha_timestamp 
ON articulos (arti_fecha_timestamp);
