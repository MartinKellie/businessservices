-- Required Postgres extensions for the directory.
--   postgis        : geography column + radius ("Cerca de mí") queries
--   pg_trgm        : fuzzy / misspelling matching for search
--   unaccent       : accent-insensitive Spanish search
--   fuzzystrmatch  : additional phonetic/edit-distance helpers for search tuning
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- `unaccent()` is only STABLE, so it cannot be used directly in generated
-- columns or expression indexes. This IMMUTABLE wrapper pins the dictionary and
-- is safe to index on. Use `f_unaccent(...)` everywhere search normalisation is
-- needed (never bare `unaccent(...)`).
CREATE OR REPLACE FUNCTION f_unaccent(text)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE
  PARALLEL SAFE
  STRICT
AS $$
  SELECT unaccent('unaccent', $1)
$$;

-- Normalises a search string the same way stored search columns are normalised:
-- unaccented, lower-cased, whitespace-collapsed and trimmed. Must mirror
-- `normaliseSearchText()` in src/lib/text.ts exactly.
CREATE OR REPLACE FUNCTION search_normalise(text)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE
  PARALLEL SAFE
  STRICT
AS $$
  SELECT btrim(regexp_replace(lower(f_unaccent($1)), '\s+', ' ', 'g'))
$$;
