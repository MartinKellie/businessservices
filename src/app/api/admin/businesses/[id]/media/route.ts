import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { HttpError, handle } from '@/lib/http';
import {
  listBusinessMedia,
  uploadBusinessMedia,
  uploadMediaFieldsSchema,
} from '@/lib/services/media';

const params = z.object({ id: z.string().uuid() });

export const GET = handle(
  async (_request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    await requireAdmin();
    const { id } = params.parse(await ctx.params);
    return NextResponse.json({ media: await listBusinessMedia(id) });
  },
);

export const POST = handle(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const actor = await requireAdmin();
    const { id } = params.parse(await ctx.params);

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      throw new HttpError(422, 'file_required', 'Debe adjuntar un archivo de imagen.', {
        file: 'Requerido.',
      });
    }
    const fields = uploadMediaFieldsSchema.parse({
      type: form.get('type'),
      altText: form.get('altText') ?? undefined,
    });
    const media = await uploadBusinessMedia(id, actor, file, fields);
    return NextResponse.json({ media }, { status: 201 });
  },
);
