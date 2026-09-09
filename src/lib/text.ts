/**
 * Search-text normalisation helpers.
 *
 * These MUST stay in lock-step with the SQL `search_normalise()` /
 * `f_unaccent()` functions (see drizzle/0000_enable_extensions.sql), so that a
 * query string is normalised the same way in the application as the stored
 * search columns are in the database.
 */

/** Removes diacritics (á→a, ñ→n, ü→u, …). */
export function stripDiacritics(input: string): string {
  return input.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/** Lower-cased, unaccented, whitespace-collapsed. Mirrors `search_normalise()`. */
export function normaliseSearchText(input: string): string {
  return stripDiacritics(input).toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Splits a normalised query into distinct word tokens. */
export function tokenise(input: string): string[] {
  return normaliseSearchText(input)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}
