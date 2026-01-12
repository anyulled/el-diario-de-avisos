-- Migration: Add arti_fecha_timestamp column and date extraction function
-- Purpose: Transform invalid MDB-exported dates to proper timestamps by extracting
--          actual dates from article content (arti_contenido)

-- Step 1: Add the new timestamp column (nullable)
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS arti_fecha_timestamp TIMESTAMP WITHOUT TIME ZONE;

-- Step 2: Create function to extract Spanish dates from article content
-- Patterns: 
-- 1. "DD de MONTH de YYYY" (e.g., "6 de febrero de 1874")
-- 2. "1º de MONTH de YYYY" (e.g., "1º de setiembre de 1875")
-- 3. "MONTH YYYY" (e.g., "Setiembre 1886")
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
  safe_content bytea;
BEGIN
  -- Return NULL if content is null
  IF content IS NULL THEN
    RETURN NULL;
  END IF;

  -- Step 0: Remove null bytes from bytea to prevent convert_from failure
  -- PostgreSQL text cannot contain null characters (\0)
  safe_content := decode(replace(encode(content, 'hex'), '00', ''), 'hex');

  -- Decode from Windows-1252 encoding
  BEGIN
    decoded_text := convert_from(safe_content, 'WIN1252');
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to LATIN1 if WIN1252 fails
    BEGIN
      decoded_text := convert_from(safe_content, 'LATIN1');
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

  -- Pattern 1: DD de MONTH de YYYY (Highly flexible but distance-limited)
  -- Handles: "30 de junio de de 1883", "14 de mayo1875", "17 de cotubre é 1877", etc.
  -- Relaxed month start for joined words, and relaxed year start for joined years.
  date_match := regexp_match(
    cleaned_text,
    '(\d{1,2})(?:º|°)?\s*.{0,12}?(enero|febrero|marzo|abril|abirl|mayo|junio|julio|agosto|septiembre|setiembre|setimbre|siembre|octubre|cotubre|noviembre|diciembre).*?(\d{4})\M',
    'i'
  );

  IF date_match IS NOT NULL THEN
    day_str := date_match[1];
    month_str := date_match[2];
    year_str := date_match[3];
  ELSE
    -- Pattern 2: MONTH DD YYYY (Flexible)
    date_match := regexp_match(
      cleaned_text,
      '(enero|febrero|marzo|abril|abirl|mayo|junio|julio|agosto|septiembre|setiembre|setimbre|siembre|octubre|cotubre|noviembre|diciembre).*?(\d{1,2})\M.{0,12}?(\d{4})\M',
      'i'
    );
    
    IF date_match IS NOT NULL THEN
      day_str := date_match[2];
      month_str := date_match[1];
      year_str := date_match[3];
    ELSE
      -- Pattern 3: MONTH YYYY (Flexible fallback)
      date_match := regexp_match(
        cleaned_text,
        '(enero|febrero|marzo|abril|abirl|mayo|junio|julio|agosto|septiembre|setiembre|setimbre|siembre|octubre|cotubre|noviembre|diciembre).*?(\d{4})\M',
        'i'
      );
      
      IF date_match IS NOT NULL THEN
        day_str := '1'; -- Default to first of month
        month_str := date_match[1];
        year_str := date_match[2];
      ELSE
        RETURN NULL;
      END IF;
    END IF;
  END IF;

  -- Convert month name to number
  month_num := CASE month_str
    WHEN 'enero' THEN 1
    WHEN 'febrero' THEN 2
    WHEN 'marzo' THEN 3
    WHEN 'abril' THEN 4
    WHEN 'abirl' THEN 4 -- Common typo
    WHEN 'mayo' THEN 5
    WHEN 'junio' THEN 6
    WHEN 'julio' THEN 7
    WHEN 'agosto' THEN 8
    WHEN 'septiembre' THEN 9
    WHEN 'setiembre' THEN 9
    WHEN 'setimbre' THEN 9 -- Common typo
    WHEN 'siembre' THEN 12 -- Usually mangled "diciembre" or "septiembre"
    WHEN 'octubre' THEN 10
    WHEN 'cotubre' THEN 10
    WHEN 'noviembre' THEN 11
    WHEN 'diciembre' THEN 12
    ELSE NULL
  END;

  IF month_num IS NULL THEN
    RETURN NULL;
  END IF;

  -- Handle suspicious days (likely OCR/transcription errors)
  IF day_str::integer > 31 THEN
    day_str := '1';
  END IF;

  -- Construct date
  BEGIN
    result_date := make_date(year_str::integer, month_num, day_str::integer);
    RETURN result_date::timestamp;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback to first of month if specific day is invalid (e.g., Feb 30)
    BEGIN
      result_date := make_date(year_str::integer, month_num, 1);
      RETURN result_date::timestamp;
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL;
    END;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 3: Populate arti_fecha_timestamp (or arti_fecha if already renamed)
-- Clear previous results and re-run to ensure we use the most accurate logic
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articulos' AND column_name = 'arti_fecha_timestamp') THEN
        UPDATE articulos SET arti_fecha_timestamp = extract_article_date(arti_contenido);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'articulos' AND column_name = 'arti_fecha') THEN
        UPDATE articulos SET arti_fecha = extract_article_date(arti_contenido);
    END IF;
END $$;

-- Step 4: Create index on the new timestamp column for date-based queries
CREATE INDEX IF NOT EXISTS idx_articulos_fecha_timestamp 
ON articulos (arti_fecha_timestamp);
