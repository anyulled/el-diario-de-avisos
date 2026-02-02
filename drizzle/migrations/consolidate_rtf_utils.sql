-- Migration: Consolidate RTF cleaning and fix date extraction duplication
-- Purpose: Extract shared logic into strip_rtf_content and reuse it in extraction functions

CREATE OR REPLACE FUNCTION strip_rtf_content(content bytea) RETURNS text AS $$
DECLARE
  decoded_text text;
  cleaned_text text;
  safe_content bytea;
BEGIN
  IF content IS NULL THEN
    RETURN '';
  END IF;

  -- Phase 0: Remove null bytes (\0) which are invalid in PG text
  safe_content := decode(replace(encode(content, 'hex'), '00', ''), 'hex');

  -- Phase 1: Decoding with fallback
  BEGIN
    decoded_text := convert_from(safe_content, 'WIN1252');
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      decoded_text := convert_from(safe_content, 'LATIN1');
    EXCEPTION WHEN OTHERS THEN
      RETURN '';
    END;
  END;

  -- Phase 2: RTF Cleaning
  IF decoded_text ~ '^\s*\{\\rtf' THEN
    cleaned_text := decoded_text;
    
    -- Accents and special characters (RTF hex)
    cleaned_text := REPLACE(cleaned_text, E'\\''e1', 'á');
    cleaned_text := REPLACE(cleaned_text, E'\\''e9', 'é');
    cleaned_text := REPLACE(cleaned_text, E'\\''ed', 'í');
    cleaned_text := REPLACE(cleaned_text, E'\\''f3', 'ó');
    cleaned_text := REPLACE(cleaned_text, E'\\''fa', 'ú');
    cleaned_text := REPLACE(cleaned_text, E'\\''fc', 'ü');
    cleaned_text := REPLACE(cleaned_text, E'\\''f1', 'ñ');
    cleaned_text := REPLACE(cleaned_text, E'\\''c1', 'Á');
    cleaned_text := REPLACE(cleaned_text, E'\\''c9', 'É');
    cleaned_text := REPLACE(cleaned_text, E'\\''cd', 'Í');
    cleaned_text := REPLACE(cleaned_text, E'\\''d3', 'Ó');
    cleaned_text := REPLACE(cleaned_text, E'\\''da', 'Ú');
    cleaned_text := REPLACE(cleaned_text, E'\\''dc', 'Ü');
    cleaned_text := REPLACE(cleaned_text, E'\\''d1', 'Ñ');
    cleaned_text := REPLACE(cleaned_text, E'\\''bf', '¿');
    cleaned_text := REPLACE(cleaned_text, E'\\''a1', '¡');
    
    -- Strip control words
    cleaned_text := regexp_replace(cleaned_text, '\\\\[a-z]+(-?[0-9]+)?', '', 'g');
    -- Any remaining hex
    cleaned_text := regexp_replace(cleaned_text, E'\\\\''[0-9a-f]{2}', '', 'igi');
    -- Braces and backslashes
    cleaned_text := regexp_replace(cleaned_text, '[{}\\\\]', '', 'g');
    -- Final whitespace cleanup
    cleaned_text := regexp_replace(cleaned_text, '\s+', ' ', 'g');
    RETURN trim(cleaned_text);
  ELSE
    RETURN trim(regexp_replace(decoded_text, '\s+', ' ', 'g'));
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Now redefine extract_article_date to be much cleaner
CREATE OR REPLACE FUNCTION extract_article_date(content bytea) RETURNS timestamp AS $$
DECLARE
  cleaned_text text;
  date_match text[];
  roman_match text[];
  day_str text;
  month_str text;
  year_str text;
  month_num integer;
BEGIN
  cleaned_text := lower(strip_rtf_content(content));
  IF cleaned_text = '' THEN RETURN NULL; END IF;

  -- Logic from original function (consolidated patterns)
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
        -- Fallback for article 41522
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

  month_num := CASE month_str
    WHEN 'enero' THEN 1 WHEN 'febrero' THEN 2 WHEN 'marzo' THEN 3
    WHEN 'abril' THEN 4 WHEN 'abirl' THEN 4 WHEN 'mayo' THEN 5
    WHEN 'junio' THEN 6 WHEN 'julio' THEN 7 WHEN 'agosto' THEN 8
    WHEN 'septiembre' THEN 9 WHEN 'setiembre' THEN 9 WHEN 'septimbre' THEN 9 WHEN 'setimbre' THEN 9
    WHEN 'siembre' THEN 12 WHEN 'octubre' THEN 10 WHEN 'cotubre' THEN 10
    WHEN 'noviembre' THEN 11 WHEN 'diciembre' THEN 12
    WHEN 'i' THEN 1 WHEN 'ii' THEN 2 WHEN 'iii' THEN 3 WHEN 'iv' THEN 4
    WHEN 'v' THEN 5 WHEN 'vi' THEN 6 WHEN 'vii' THEN 7 WHEN 'viii' THEN 8
    WHEN 'ix' THEN 9 WHEN 'x' THEN 10 WHEN 'xi' THEN 11 WHEN 'xii' THEN 12
    ELSE NULL
  END;

  IF month_num IS NULL THEN RETURN NULL; END IF;
  IF day_str::integer > 31 THEN day_str := '1'; END IF;

  BEGIN
    RETURN make_date(year_str::integer, month_num, day_str::integer)::timestamp;
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      RETURN make_date(year_str::integer, month_num, 1)::timestamp;
    EXCEPTION WHEN OTHERS THEN
      RETURN NULL;
    END;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Redefine extract_valid_year to use the utility as well
CREATE OR REPLACE FUNCTION extract_valid_year(content bytea) RETURNS integer AS $$
DECLARE
  cleaned_text text;
  year_match text[];
BEGIN
  cleaned_text := strip_rtf_content(content);
  IF cleaned_text = '' THEN RETURN NULL; END IF;
  
  year_match := regexp_match(cleaned_text, '(enero|febrero|marzo|abril|mayo|junio|julio|agosto|setiembre|septiembre|octubre|noviembre|diciembre)\s+(\d{4})', 'i');
  IF year_match IS NOT NULL AND year_match[2]::integer BETWEEN 1800 AND 1899 THEN
    RETURN year_match[2]::integer;
  END IF;
  
  year_match := regexp_match(cleaned_text, '\bde?\s+(18\d{2})\b', 'i');
  IF year_match IS NOT NULL THEN RETURN year_match[1]::integer; END IF;
  
  year_match := regexp_match(cleaned_text, '\b(18\d{2})\b');
  IF year_match IS NOT NULL THEN RETURN year_match[1]::integer; END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
