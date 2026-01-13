-- Migration: Fix article dates where edition number (Número) was incorrectly used as year
-- Applied: 2026-01-13
-- Affected: 44 articles (IDs 2927-2971)
-- 
-- Root cause: The regex in extract_article_date captured the first 4-digit number after
-- the month, which could be the edition number instead of the year.
-- 
-- Example: "Sábado 15 de noviembre de 1879. ( Año VII, Mes 7, Número 1897)"
--          The function extracted 1897 (edition #) instead of 1879 (correct year)

BEGIN;

-- Stage 1: Fix the 44 affected articles with correct dates
-- All these articles are from 1879, and we need to extract the correct day/month

-- Extract correct dates from content and fix them
WITH corrected_dates AS (
  SELECT 
    arti_cod,
    (regexp_match(
      convert_from(decode(replace(encode(arti_contenido, 'hex'), '00', ''), 'hex'), 'WIN1252'),
      '(\d{1,2})\s*de\s*(enero|febrero|marzo|abril|mayo|junio|julio|agosto|setiembre|septiembre|octubre|noviembre|diciembre)\s*de\s*(18\d{2})\.',
      'i'
    )) as date_parts
  FROM articulos
  WHERE arti_cod IN (
    2927, 2928, 2929, 2930, 2931, 2932, 2933, 2934, 2935, 2936,
    2937, 2938, 2939, 2940, 2941, 2942, 2943, 2944, 2945, 2946,
    2947, 2948, 2949, 2950, 2951, 2952, 2953, 2954, 2955, 2956,
    2957, 2958, 2959, 2960, 2961, 2962, 2963, 2964, 2965, 2966,
    2967, 2968, 2970, 2971
  )
),
parsed_dates AS (
  SELECT 
    arti_cod,
    date_parts[1]::integer as day_num,
    CASE lower(date_parts[2])
      WHEN 'enero' THEN 1
      WHEN 'febrero' THEN 2
      WHEN 'marzo' THEN 3
      WHEN 'abril' THEN 4
      WHEN 'mayo' THEN 5
      WHEN 'junio' THEN 6
      WHEN 'julio' THEN 7
      WHEN 'agosto' THEN 8
      WHEN 'setiembre' THEN 9
      WHEN 'septiembre' THEN 9
      WHEN 'octubre' THEN 10
      WHEN 'noviembre' THEN 11
      WHEN 'diciembre' THEN 12
    END as month_num,
    date_parts[3]::integer as year_num
  FROM corrected_dates
  WHERE date_parts IS NOT NULL
)
UPDATE articulos a
SET arti_fecha = make_timestamp(p.year_num, p.month_num, p.day_num, 0, 0, 0)
FROM parsed_dates p
WHERE a.arti_cod = p.arti_cod;

-- Stage 2: Update the extract_article_date function with stricter regex
-- The key change: year must immediately follow "de [month] de" with only whitespace
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

  -- Pattern 1: STRICT - DD de MONTH de YYYY followed by period or parenthesis
  -- This is the primary pattern that prevents capturing edition numbers
  -- The year must immediately follow "de [month] de " with only optional whitespace
  date_match := regexp_match(
    cleaned_text,
    '(\d{1,2})(?:º|°)?\s+de\s+(enero|febrero|marzo|abril|abirl|mayo|junio|julio|agosto|septiembre|setiembre|setimbre|siembre|octubre|cotubre|noviembre|diciembre)\s+de\s+(\d{4})(?=[\.\s\(\)])',
    'i'
  );

  IF date_match IS NOT NULL THEN
    day_str := date_match[1];
    month_str := date_match[2];
    year_str := date_match[3];
  ELSE
    -- Pattern 2: RELAXED - Allow some intervening characters but limit to 5
    -- This handles typos like "de de" but still prevents edition number capture
    date_match := regexp_match(
      cleaned_text,
      '(\d{1,2})(?:º|°)?\s*.{0,5}?(enero|febrero|marzo|abril|abirl|mayo|junio|julio|agosto|septiembre|setiembre|setimbre|siembre|octubre|cotubre|noviembre|diciembre)\s*.{0,8}?(\d{4})(?=[\.\s\(\)])',
      'i'
    );
    
    IF date_match IS NOT NULL THEN
      day_str := date_match[1];
      month_str := date_match[2];
      year_str := date_match[3];
    ELSE
      -- Pattern 3: MONTH DD YYYY (Flexible)
      date_match := regexp_match(
        cleaned_text,
        '(enero|febrero|marzo|abril|abirl|mayo|junio|julio|agosto|septiembre|setiembre|setimbre|siembre|octubre|cotubre|noviembre|diciembre)\s+(\d{1,2})\M.{0,8}?(\d{4})(?=[\.\s\(\)])',
        'i'
      );
      
      IF date_match IS NOT NULL THEN
        day_str := date_match[2];
        month_str := date_match[1];
        year_str := date_match[3];
      ELSE
        -- Pattern 4: MONTH YYYY (Flexible fallback, day defaults to 1)
        date_match := regexp_match(
          cleaned_text,
          '(enero|febrero|marzo|abril|abirl|mayo|junio|julio|agosto|septiembre|setiembre|setimbre|siembre|octubre|cotubre|noviembre|diciembre)\s+de?\s*(\d{4})(?=[\.\s\(\)])',
          'i'
        );
        
        IF date_match IS NOT NULL THEN
          day_str := '1'; -- Default to first of month
          month_str := date_match[1];
          year_str := date_match[2];
        ELSE
          -- Pattern 5: Last resort - Original relaxed pattern but only for 18xx years
          date_match := regexp_match(
            cleaned_text,
            '(\d{1,2})(?:º|°)?\s*.{0,12}?(enero|febrero|marzo|abril|abirl|mayo|junio|julio|agosto|septiembre|setiembre|setimbre|siembre|octubre|cotubre|noviembre|diciembre).{0,12}?(18\d{2})\M',
            'i'
          );
          
          IF date_match IS NOT NULL THEN
            day_str := date_match[1];
            month_str := date_match[2];
            year_str := date_match[3];
          ELSE
            RETURN NULL;
          END IF;
        END IF;
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

COMMIT;
