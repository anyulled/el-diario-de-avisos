-- Migration: Fix missing month names and typos in date extraction
-- Purpose: Recover dates for articles with "Septimbre" typo or roman numeral month metadata

CREATE OR REPLACE FUNCTION extract_article_date(content bytea) RETURNS timestamp AS $$
DECLARE
  decoded_text text;
  cleaned_text text;
  date_match text[];
  roman_match text[];
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

  -- Remove null bytes from bytea
  safe_content := decode(replace(encode(content, 'hex'), '00', ''), 'hex');

  -- Decode from Windows-1252
  BEGIN
    decoded_text := convert_from(safe_content, 'WIN1252');
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      decoded_text := convert_from(safe_content, 'LATIN1');
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL;
    END;
  END;

  -- Clean RTF if applicable
  IF decoded_text ~ '^\s*\{\\rtf' THEN
    cleaned_text := regexp_replace(decoded_text, E'\\\\''e1', 'á', 'g');
    cleaned_text := regexp_replace(cleaned_text, E'\\\\''e9', 'é', 'g');
    cleaned_text := regexp_replace(cleaned_text, E'\\\\''ed', 'í', 'g');
    cleaned_text := regexp_replace(cleaned_text, E'\\\\''f3', 'ó', 'g');
    cleaned_text := regexp_replace(cleaned_text, E'\\\\''fa', 'ú', 'g');
    cleaned_text := regexp_replace(cleaned_text, E'\\\\''f1', 'ñ', 'g');
    cleaned_text := regexp_replace(cleaned_text, '\\[a-z]+(-?[0-9]+)?', '', 'g');
    cleaned_text := regexp_replace(cleaned_text, E'\\\\''[0-9a-fA-F]{2}', '', 'g');
    cleaned_text := regexp_replace(cleaned_text, '[{}\\]', '', 'g');
  ELSE
    cleaned_text := decoded_text;
  END IF;

  cleaned_text := lower(cleaned_text);

  -- Pattern 1: DD de MONTH de YYYY (Highly flexible)
  -- Added "septimbre" typo
  date_match := regexp_match(
    cleaned_text,
    '(\d{1,2})(?:º|°)?\s*.{0,12}?(enero|febrero|marzo|abril|abirl|mayo|junio|julio|agosto|septiembre|setiembre|septimbre|setimbre|siembre|octubre|cotubre|noviembre|diciembre).*?(\d{4})\M',
    'i'
  );

  IF date_match IS NOT NULL THEN
    day_str := date_match[1];
    month_str := date_match[2];
    year_str := date_match[3];
  ELSE
    -- Pattern 2: MONTH DD YYYY
    date_match := regexp_match(
      cleaned_text,
      '(enero|febrero|marzo|abril|abirl|mayo|junio|julio|agosto|septiembre|setiembre|septimbre|setimbre|siembre|octubre|cotubre|noviembre|diciembre).*?(\d{1,2})\M.{0,12}?(\d{4})\M',
      'i'
    );
    
    IF date_match IS NOT NULL THEN
      day_str := date_match[2];
      month_str := date_match[1];
      year_str := date_match[3];
    ELSE
      -- Pattern 3: MONTH YYYY
      date_match := regexp_match(
        cleaned_text,
        '(enero|febrero|marzo|abril|abirl|mayo|junio|julio|agosto|septiembre|setiembre|septimbre|setimbre|siembre|octubre|cotubre|noviembre|diciembre).*?(\d{4})\M',
        'i'
      );
      
      IF date_match IS NOT NULL THEN
        day_str := '1';
        month_str := date_match[1];
        year_str := date_match[2];
      ELSE
        -- Pattern 4: DD de YYYY + optional Roman Numeral Month (fallback for article 41522)
        -- Example: "Sábado 04 de 1884. ( ... Mes IX ... )"
        date_match := regexp_match(cleaned_text, '(\d{1,2})(?:º|°)?\s*de\s*(\d{4})\M', 'i');
        roman_match := regexp_match(cleaned_text, 'mes\s+([ivx]+)\M', 'i');
        
        IF date_match IS NOT NULL AND roman_match IS NOT NULL THEN
          day_str := date_match[1];
          year_str := date_match[2];
          month_str := roman_match[1];
        ELSE
          RETURN NULL;
        END IF;
      END IF;
    END IF;
  END IF;

  -- Convert month name or roman numeral to number
  month_num := CASE month_str
    WHEN 'enero' THEN 1
    WHEN 'febrero' THEN 2
    WHEN 'marzo' THEN 3
    WHEN 'abril' THEN 4
    WHEN 'abirl' THEN 4
    WHEN 'mayo' THEN 5
    WHEN 'junio' THEN 6
    WHEN 'julio' THEN 7
    WHEN 'agosto' THEN 8
    WHEN 'septiembre' THEN 9
    WHEN 'setiembre' THEN 9
    WHEN 'septimbre' THEN 9
    WHEN 'setimbre' THEN 9
    WHEN 'siembre' THEN 12
    WHEN 'octubre' THEN 10
    WHEN 'cotubre' THEN 10
    WHEN 'noviembre' THEN 11
    WHEN 'diciembre' THEN 12
    -- Roman Numerals
    WHEN 'i' THEN 1
    WHEN 'ii' THEN 2
    WHEN 'iii' THEN 3
    WHEN 'iv' THEN 4
    WHEN 'v' THEN 5
    WHEN 'vi' THEN 6
    WHEN 'vii' THEN 7
    WHEN 'viii' THEN 8
    WHEN 'ix' THEN 9
    WHEN 'x' THEN 10
    WHEN 'xi' THEN 11
    WHEN 'xii' THEN 12
    ELSE NULL
  END;

  IF month_num IS NULL THEN
    RETURN NULL;
  END IF;

  IF day_str::integer > 31 THEN
    day_str := '1';
  END IF;

  BEGIN
    result_date := make_date(year_str::integer, month_num, day_str::integer);
    RETURN result_date::timestamp;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      result_date := make_date(year_str::integer, month_num, 1);
      RETURN result_date::timestamp;
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL;
    END;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update articles with NULL dates using the improved function
UPDATE articulos SET arti_fecha = extract_article_date(arti_contenido) WHERE arti_fecha IS NULL;
