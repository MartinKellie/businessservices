import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/env';
import { HttpError, handle } from '@/lib/http';
import { runEnquiryRetention } from '@/lib/services/enquiries';

/**
 * Vercel Cron target (scope §37) — see `vercel.json`. Vercel sends
 * `Authorization: Bearer $CRON_SECRET` automatically when that env var is set.
 */
export const GET = handle(async (request: NextRequest) => {
  if (!env.CRON_SECRET || request.headers.get('authorization') !== `Bearer ${env.CRON_SECRET}`) {
    throw new HttpError(401, 'unauthenticated', 'No autorizado.');
  }
  return NextResponse.json(await runEnquiryRetention());
});
