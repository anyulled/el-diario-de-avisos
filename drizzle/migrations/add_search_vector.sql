-- Full-text search migration with content indexing and RTF stripping
-- This migration adds a search_vector column to enable fast, relevant searches

-- Step 1: Add the search_vector column
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Step 2: Create GIN index for efficient searching
CREATE INDEX IF NOT EXISTS idx_articulos_search_vector 
ON articulos USING GIN(search_vector);

-- Step 3: Create function to strip RTF formatting from content
CREATE OR REPLACE FUNCTION strip_rtf_content(content bytea) RETURNS text AS $$
DECLARE
  decoded_text text;
  cleaned_text text;
BEGIN
  -- Return empty string if content is null
  IF content IS NULL THEN
    RETURN '';
  END IF;
  
  -- Decode from Windows-1252 encoding
  decoded_text := convert_from(content, 'WIN1252');
  
  -- Check if content is RTF (starts with {\rtf)
  IF decoded_text ~ '^\s*\{\\rtf' THEN
    -- First, convert RTF hex sequences to actual characters
    -- This preserves accented characters instead of deleting them
    
    -- Lowercase accented vowels
    cleaned_text := regexp_replace(decoded_text, E'\\\\'e1', 'á', 'g');  -- á
    cleaned_text := regexp_replace(cleaned_text, E'\\\\'e9', 'é', 'g');  -- é
    cleaned_text := regexp_replace(cleaned_text, E'\\\\'ed', 'í', 'g');  -- í
    cleaned_text := regexp_replace(cleaned_text, E'\\\\'f3', 'ó', 'g');  -- ó
    cleaned_text := regexp_replace(cleaned_text, E'\\\\'fa', 'ú', 'g');  -- ú
    cleaned_text := regexp_replace(cleaned_text, E'\\\\'fc', 'ü', 'g');  -- ü
    
    -- Uppercase accented vowels
    cleaned_text := regexp_replace(cleaned_text, E'\\\\'c1', 'Á', 'g');  -- Á
    cleaned_text := regexp_replace(cleaned_text, E'\\\\'c9', 'É', 'g');  -- É
    cleaned_text := regexp_replace(cleaned_text, E'\\\\'cd', 'Í', 'g');  -- Í
    cleaned_text := regexp_replace(cleaned_text, E'\\\\'d3', 'Ó', 'g');  -- Ó
    cleaned_text := regexp_replace(cleaned_text, E'\\\\'da', 'Ú', 'g');  -- Ú
    cleaned_text := regexp_replace(cleaned_text, E'\\\\'dc', 'Ü', 'g');  -- Ü
    
    -- Ñ and ñ
    cleaned_text := regexp_replace(cleaned_text, E'\\\\'f1', 'ñ', 'g');  -- ñ
    cleaned_text := regexp_replace(cleaned_text, E'\\\\'d1', 'Ñ', 'g');  -- Ñ
    
    -- Common punctuation
    cleaned_text := regexp_replace(cleaned_text, E'\\\\'bf', '¿', 'g');  -- ¿
    cleaned_text := regexp_replace(cleaned_text, E'\\\\'a1', '¡', 'g');  -- ¡
    
    -- Strip RTF control words (e.g., \rtf1, \ansi, etc.)
    cleaned_text := regexp_replace(cleaned_text, '\\[a-z]+(-?[0-9]+)?', '', 'g');
    
    -- Remove any remaining unhandled hex sequences
    cleaned_text := regexp_replace(cleaned_text, E'\\\\''[0-9a-fA-F]{2}', '', 'g');
    
    -- Remove curly braces and backslashes
    cleaned_text := regexp_replace(cleaned_text, '[{}\\]', '', 'g');
    
    -- Normalize whitespace
    cleaned_text := regexp_replace(cleaned_text, '\s+', ' ', 'g');
    cleaned_text := trim(cleaned_text);
  ELSE
    -- Plain text content - just normalize whitespace
    cleaned_text := regexp_replace(decoded_text, '\s+', ' ', 'g');
    cleaned_text := trim(cleaned_text);
  END IF;
  
  RETURN cleaned_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 4: Create function to update search vector
CREATE OR REPLACE FUNCTION articulos_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('spanish', coalesce(NEW.arti_titulo, '')), 'A') ||
    setweight(to_tsvector('spanish', strip_rtf_content(NEW.arti_contenido)), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS articulos_search_vector_trigger ON articulos;

-- Step 6: Create trigger to auto-update search vector on insert/update
CREATE TRIGGER articulos_search_vector_trigger
  BEFORE INSERT OR UPDATE OF arti_titulo, arti_contenido
  ON articulos
  FOR EACH ROW
  EXECUTE FUNCTION articulos_search_vector_update();

-- Step 7: Populate search vectors for existing articles
UPDATE articulos SET search_vector = 
  setweight(to_tsvector('spanish', coalesce(arti_titulo, '')), 'A') ||
  setweight(to_tsvector('spanish', strip_rtf_content(arti_contenido)), 'C')
WHERE search_vector IS NULL;
