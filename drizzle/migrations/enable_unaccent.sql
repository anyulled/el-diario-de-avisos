-- Enable unaccent extension
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Create a new text search configuration 'spanish_unaccent'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_ts_config WHERE cfgname = 'spanish_unaccent'
    ) THEN
        CREATE TEXT SEARCH CONFIGURATION spanish_unaccent ( COPY = spanish );
    END IF;
END
$$;

-- Configure mappings to ignore accents
ALTER TEXT SEARCH CONFIGURATION spanish_unaccent
    ALTER MAPPING FOR hword, hword_part, word
    WITH unaccent, spanish_stem;

-- Update the search vector generation function
CREATE OR REPLACE FUNCTION articulos_search_vector_update() RETURNS trigger AS $$
BEGIN
  -- Use spanish_unaccent configuration
  NEW.search_vector := 
    setweight(to_tsvector('spanish_unaccent', coalesce(NEW.arti_titulo, '')), 'A') ||
    setweight(to_tsvector('spanish_unaccent', strip_rtf_content(NEW.arti_contenido)), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Regenerate search vectors with the new configuration
UPDATE articulos SET search_vector = 
  setweight(to_tsvector('spanish_unaccent', coalesce(arti_titulo, '')), 'A') ||
  setweight(to_tsvector('spanish_unaccent', strip_rtf_content(arti_contenido)), 'C');
