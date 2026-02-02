-- Migration: Fix missing month names and typos in date extraction
-- Purpose: Recover dates for articles with "Septimbre" typo or roman numeral month metadata

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

-- Update articles with NULL dates using the improved function
UPDATE articulos SET arti_fecha = extract_article_date(arti_contenido) WHERE arti_fecha IS NULL;
