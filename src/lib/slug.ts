import { normaliseSearchText } from '@/lib/text';

/** Turns a display name into a URL-safe slug: unaccented, lower-case, hyphenated. */
export function slugify(input: string): string {
  return normaliseSearchText(input)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** A short random suffix to disambiguate otherwise-identical slugs. */
export function slugSuffix(): string {
  return Math.random().toString(36).slice(2, 8);
}

/**
 * Given a base name and a function that reports whether a candidate slug is
 * already taken, returns a unique slug (appending a short suffix if needed).
 */
export async function uniqueSlug(
  name: string,
  isTaken: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(name) || 'item';
  if (!(await isTaken(base))) return base;
  for (let i = 0; i < 5; i += 1) {
    const candidate = `${base}-${slugSuffix()}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}
