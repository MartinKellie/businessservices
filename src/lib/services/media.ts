import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { businessMedia, businesses } from '@/db/schema';
import { HttpError } from '@/lib/http';
import { deleteObject, putObject } from '@/lib/blob';
import { ACCEPTED_EXTENSION, MAX_UPLOAD_BYTES, isAcceptedImageType } from '@/lib/media-constraints';
import type { AdminIdentity } from '@/lib/auth-guards';
import { slugify } from '@/lib/slug';

export const uploadMediaFieldsSchema = z.object({
  type: z.enum(['logo', 'photo']),
  altText: z.string().trim().max(300).optional(),
});

export async function listBusinessMedia(businessId: string) {
  return db
    .select()
    .from(businessMedia)
    .where(eq(businessMedia.businessId, businessId))
    .orderBy(asc(businessMedia.type), asc(businessMedia.sortOrder), asc(businessMedia.createdAt));
}

export async function uploadBusinessMedia(
  businessId: string,
  actor: AdminIdentity,
  file: File,
  fields: z.infer<typeof uploadMediaFieldsSchema>,
) {
  const business = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
    columns: { id: true, slug: true },
  });
  if (!business) throw new HttpError(404, 'not_found', 'Negocio no encontrado.');

  const contentType = file.type;
  if (!isAcceptedImageType(contentType)) {
    throw new HttpError(
      422,
      'unsupported_type',
      'Formato de imagen no permitido (JPG, PNG o WebP).',
      {
        file: 'Formato no permitido.',
      },
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new HttpError(
      422,
      'file_too_large',
      'La imagen supera el tamaño máximo permitido (5 MB).',
      {
        file: 'Archivo demasiado grande.',
      },
    );
  }

  const ext = ACCEPTED_EXTENSION[contentType];
  const pathname = `businesses/${slugify(business.slug)}/${fields.type}-${Date.now()}.${ext}`;
  const stored = await putObject(pathname, await file.arrayBuffer(), contentType);

  const [row] = await db
    .insert(businessMedia)
    .values({
      businessId,
      type: fields.type,
      source: 'admin',
      blobUrl: stored.url,
      blobPathname: stored.pathname,
      contentType,
      byteSize: file.size,
      altText: fields.altText ?? null,
      // MK1GROUP admin uploads are trusted; enquiry-sourced media stays pending.
      reviewStatus: 'approved',
      reviewedBy: actor.adminId,
      reviewedAt: sql`now()`,
    })
    .returning();
  return row;
}

export const reviewMediaSchema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('approve') }),
  z.object({ decision: z.literal('reject') }),
]);

export async function reviewMedia(
  id: string,
  decision: z.infer<typeof reviewMediaSchema>,
  actor: AdminIdentity,
) {
  const [row] = await db
    .update(businessMedia)
    .set({
      reviewStatus: decision.decision === 'approve' ? 'approved' : 'rejected',
      reviewedBy: actor.adminId,
      reviewedAt: sql`now()`,
      updatedAt: sql`now()`,
    })
    .where(eq(businessMedia.id, id))
    .returning();
  if (!row) throw new HttpError(404, 'not_found', 'Imagen no encontrada.');
  return row;
}

export async function deleteMedia(id: string) {
  const media = await db.query.businessMedia.findFirst({ where: eq(businessMedia.id, id) });
  if (!media) throw new HttpError(404, 'not_found', 'Imagen no encontrada.');
  await db.delete(businessMedia).where(eq(businessMedia.id, id));
  try {
    await deleteObject(media.blobUrl);
  } catch {
    // The row is gone; a leftover blob is cleaned up by lifecycle jobs later.
  }
}

export const reorderMediaSchema = z.object({ orderedIds: z.array(z.string().uuid()).min(1) });

export async function reorderMedia(businessId: string, input: z.infer<typeof reorderMediaSchema>) {
  const owned = await db
    .select({ id: businessMedia.id })
    .from(businessMedia)
    .where(
      and(eq(businessMedia.businessId, businessId), inArray(businessMedia.id, input.orderedIds)),
    );
  if (owned.length !== input.orderedIds.length) {
    throw new HttpError(422, 'invalid_media', 'Una o más imágenes no pertenecen a este negocio.');
  }
  await db.transaction(async (tx) => {
    for (const [index, id] of input.orderedIds.entries()) {
      await tx
        .update(businessMedia)
        .set({ sortOrder: index, updatedAt: sql`now()` })
        .where(eq(businessMedia.id, id));
    }
  });
  return listBusinessMedia(businessId);
}
