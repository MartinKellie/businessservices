/**
 * Drizzle schema barrel. One module per domain area.
 *
 * Extensions and the immutable `f_unaccent` / `search_normalise` helpers that the
 * generated columns and trigram indexes depend on are created by the
 * hand-written migration `drizzle/0000_enable_extensions.sql`, which runs first.
 */
export * from './enums';
export * from './areas';
export * from './businesses';
export * from './taxonomy';
export * from './operations';
export * from './media';
export * from './enquiries';
export * from './settings';
export * from './imports';
