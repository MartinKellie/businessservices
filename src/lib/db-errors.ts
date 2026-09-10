/**
 * Drizzle wraps the underlying `pg` error, so the useful fields (`code`,
 * `constraint`) live on `error.cause`. These helpers read through either shape.
 */
type PgLike = {
  code?: string;
  constraint?: string;
  cause?: { code?: string; constraint?: string };
};

export function pgConstraint(error: unknown): string | undefined {
  const e = error as PgLike;
  return e.constraint ?? e.cause?.constraint;
}

export function pgCode(error: unknown): string | undefined {
  const e = error as PgLike;
  return e.code ?? e.cause?.code;
}

/** True for a unique-violation (SQLSTATE 23505), optionally on a named constraint. */
export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  if (pgCode(error) !== '23505') return false;
  return constraint ? pgConstraint(error) === constraint : true;
}
