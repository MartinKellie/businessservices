import { NextResponse, type NextRequest } from 'next/server';
import { handle } from '@/lib/http';
import { assertNotInMaintenance } from '@/lib/maintenance';
import { requestMeta } from '@/lib/request-meta';
import { createEnquiry, createEnquirySchema } from '@/lib/services/enquiries';

export const dynamic = 'force-dynamic';

/**
 * Public contact form (scope §33). Accepts `multipart/form-data` (with an
 * optional `file`) or `application/json`. Requires the `consent` checkbox and
 * ignores submissions with the honeypot `company` field filled.
 */
export const POST = handle(async (request: NextRequest) => {
  await assertNotInMaintenance();

  const contentType = request.headers.get('content-type') ?? '';
  let raw: Record<string, unknown>;
  let file: File | null = null;

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const maybeFile = form.get('file');
    file = maybeFile instanceof File ? maybeFile : null;
    raw = Object.fromEntries(
      [...form.entries()].filter(([, v]) => typeof v === 'string') as [string, string][],
    );
    raw.consent = ['true', 'on', '1'].includes(String(raw.consent));
  } else {
    raw = (await request.json()) as Record<string, unknown>;
  }

  const input = createEnquirySchema.parse(raw);
  const meta = requestMeta(request);
  const result = await createEnquiry(input, { ...meta, file });

  return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
});
