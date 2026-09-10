import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { env } from '@/env';

/**
 * Client metadata for abuse controls. The IP is stored only as a salted hash
 * (scope §43 — minimise personal data in enquiries).
 */
export function requestMeta(request: NextRequest): {
  ipHash: string | null;
  userAgent: string | null;
} {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
  const ipHash = ip
    ? createHash('sha256')
        .update(`${ip}:${env.AUTH_SECRET ?? 'salt'}`)
        .digest('hex')
    : null;
  return { ipHash, userAgent: request.headers.get('user-agent')?.slice(0, 500) ?? null };
}
