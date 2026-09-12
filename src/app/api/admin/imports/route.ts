import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth-guards';
import { HttpError, handle } from '@/lib/http';
import { createImportBatch, listImportBatches } from '@/lib/services/import-export';

// Import/export is an Owner/Admin capability (scope §26).
export const GET = handle(async () => {
  await requireAdmin('owner');
  return NextResponse.json({ batches: await listImportBatches() });
});

/**
 * Starts an import (scope §31): parses and validates every row up front, but
 * creates nothing in the database yet — see `/imports/:id/commit`.
 */
export const POST = handle(async (request: NextRequest) => {
  const actor = await requireAdmin('owner');
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    throw new HttpError(422, 'file_required', 'Debe adjuntar un archivo CSV o Excel.', {
      file: 'Requerido.',
    });
  }
  const declared = String(form.get('format') ?? '').toLowerCase();
  const format =
    declared === 'csv' || declared === 'xlsx'
      ? declared
      : file.name.toLowerCase().endsWith('.csv')
        ? 'csv'
        : 'xlsx';

  const batch = await createImportBatch(file, format, actor);
  return NextResponse.json({ batch }, { status: 201 });
});
