import { and, desc, eq, isNull, lt, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { businessMedia, businesses, enquiries, enquiryUploads } from '@/db/schema';
import { HttpError } from '@/lib/http';
import { deleteObject, putObject } from '@/lib/blob';
import { sendEmail } from '@/lib/email';
import { ACCEPTED_EXTENSION, MAX_UPLOAD_BYTES, isAcceptedImageType } from '@/lib/media-constraints';
import { getSettings } from '@/lib/services/settings';
import type { AdminIdentity } from '@/lib/auth-guards';

const RATE_WINDOW_MINUTES = 10;
const RATE_MAX_IN_WINDOW = 5;
const RATE_MAX_PER_DAY = 20;

export const enquiryTypeSchema = z.enum([
  'add_business',
  'update_listing',
  'advertising',
  'general',
]);

/** Public contact-form payload (scope §33, §35, §36, §43). */
export const createEnquirySchema = z.object({
  type: enquiryTypeSchema,
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(10).max(4000),
  businessReference: z.string().trim().max(200).optional(),
  // Must be ticked; stored with the enquiry.
  consent: z.literal(true),
  // Honeypot — a hidden field real users never fill. Accepted by the schema so
  // the response looks identical; the service silently drops it when non-empty.
  company: z.string().max(200).optional(),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;

async function assertWithinRateLimit(ipHash: string | null) {
  if (!ipHash) return;
  const [{ recent, today }] = await db
    .select({
      recent: sql<number>`count(*) filter (where created_at > now() - make_interval(mins => ${RATE_WINDOW_MINUTES}))::int`,
      today: sql<number>`count(*) filter (where created_at > now() - interval '1 day')::int`,
    })
    .from(enquiries)
    .where(eq(enquiries.ipHash, ipHash));

  if (recent >= RATE_MAX_IN_WINDOW || today >= RATE_MAX_PER_DAY) {
    throw new HttpError(429, 'rate_limited', 'Demasiadas solicitudes. Inténtalo más tarde.');
  }
}

export async function createEnquiry(
  input: CreateEnquiryInput,
  meta: { ipHash: string | null; userAgent: string | null; file?: File | null },
): Promise<{ id: string | null; accepted: boolean }> {
  // Honeypot filled → pretend success, store nothing.
  if (input.company) {
    console.warn('[enquiry] honeypot triggered', { ipHash: meta.ipHash });
    return { id: null, accepted: true };
  }

  await assertWithinRateLimit(meta.ipHash);

  const settings = await getSettings();

  let upload: { url: string; pathname: string; contentType: string; size: number } | null = null;
  if (meta.file && meta.file.size > 0) {
    if (!isAcceptedImageType(meta.file.type)) {
      throw new HttpError(
        422,
        'unsupported_type',
        'Formato de imagen no permitido (JPG, PNG o WebP).',
        {
          file: 'Formato no permitido.',
        },
      );
    }
    if (meta.file.size > MAX_UPLOAD_BYTES) {
      throw new HttpError(422, 'file_too_large', 'La imagen supera el tamaño máximo (5 MB).', {
        file: 'Archivo demasiado grande.',
      });
    }
    const ext = ACCEPTED_EXTENSION[meta.file.type as keyof typeof ACCEPTED_EXTENSION];
    const stored = await putObject(
      `enquiries/${Date.now()}.${ext}`,
      await meta.file.arrayBuffer(),
      meta.file.type,
    );
    upload = { ...stored, size: meta.file.size };
  }

  const enquiry = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(enquiries)
      .values({
        type: input.type,
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        message: input.message,
        businessReference: input.businessReference ?? null,
        consentGiven: true,
        consentPolicyVersion: settings.privacyPolicyVersion,
        consentAt: sql`now()`,
        ipHash: meta.ipHash,
        userAgent: meta.userAgent,
      })
      .returning();

    if (upload) {
      await tx.insert(enquiryUploads).values({
        enquiryId: row.id,
        blobUrl: upload.url,
        blobPathname: upload.pathname,
        contentType: upload.contentType,
        byteSize: upload.size,
      });
    }
    return row;
  });

  // Best-effort admin notification (scope §33).
  void sendEmail({
    subject: `Nueva consulta: ${input.type}`,
    text: [
      `Tipo: ${input.type}`,
      `Nombre: ${input.name}`,
      `Email: ${input.email}`,
      input.phone ? `Teléfono: ${input.phone}` : null,
      input.businessReference ? `Negocio: ${input.businessReference}` : null,
      '',
      input.message,
    ]
      .filter(Boolean)
      .join('\n'),
  }).catch((err) => console.error('[enquiry] notification failed', err));

  return { id: enquiry.id, accepted: true };
}

// --- Admin ------------------------------------------------------------------

export const listEnquiriesQuerySchema = z.object({
  status: z.enum(['new', 'in_progress', 'closed']).optional(),
  type: enquiryTypeSchema.optional(),
  includeDeleted: z.coerce.boolean().default(false),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function listEnquiries(query: z.infer<typeof listEnquiriesQuerySchema>) {
  const where = and(
    query.status ? eq(enquiries.status, query.status) : undefined,
    query.type ? eq(enquiries.type, query.type) : undefined,
    query.includeDeleted ? undefined : sql`${enquiries.softDeletedAt} is null`,
  );
  return db
    .select({
      id: enquiries.id,
      type: enquiries.type,
      status: enquiries.status,
      name: enquiries.name,
      email: enquiries.email,
      businessReference: enquiries.businessReference,
      createdAt: enquiries.createdAt,
      softDeletedAt: enquiries.softDeletedAt,
      uploadCount: sql<number>`(select count(*)::int from ${enquiryUploads} eu where eu.enquiry_id = ${enquiries.id})`,
    })
    .from(enquiries)
    .where(where)
    .orderBy(desc(enquiries.createdAt))
    .limit(query.limit)
    .offset(query.offset);
}

export async function getEnquiry(id: string) {
  const enquiry = await db.query.enquiries.findFirst({ where: eq(enquiries.id, id) });
  if (!enquiry) throw new HttpError(404, 'not_found', 'Consulta no encontrada.');
  const uploads = await db
    .select()
    .from(enquiryUploads)
    .where(eq(enquiryUploads.enquiryId, id))
    .orderBy(desc(enquiryUploads.createdAt));
  return { ...enquiry, uploads };
}

export const updateEnquirySchema = z
  .object({
    status: z.enum(['new', 'in_progress', 'closed']),
    adminNotes: z.string().trim().max(4000).nullable(),
    businessId: z.string().uuid().nullable(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: 'No hay cambios que aplicar.' });

export async function updateEnquiry(
  id: string,
  input: z.infer<typeof updateEnquirySchema>,
  actor: AdminIdentity,
) {
  if (input.businessId) {
    const exists = await db.query.businesses.findFirst({
      where: eq(businesses.id, input.businessId),
      columns: { id: true },
    });
    if (!exists) throw new HttpError(422, 'invalid_business', 'El negocio indicado no existe.');
  }
  const [row] = await db
    .update(enquiries)
    .set({
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.adminNotes !== undefined ? { adminNotes: input.adminNotes } : {}),
      ...(input.businessId !== undefined ? { businessId: input.businessId } : {}),
      handledBy: actor.adminId,
      updatedAt: sql`now()`,
    })
    .where(eq(enquiries.id, id))
    .returning();
  if (!row) throw new HttpError(404, 'not_found', 'Consulta no encontrada.');
  return row;
}

export const reviewUploadSchema = z.discriminatedUnion('decision', [
  z.object({ decision: z.literal('reject') }),
  z.object({
    decision: z.literal('approve'),
    // Optional: attach the approved image to a business as media.
    promoteToBusinessId: z.string().uuid().optional(),
    promoteAs: z.enum(['logo', 'photo']).optional(),
  }),
]);

export async function reviewEnquiryUpload(
  uploadId: string,
  input: z.infer<typeof reviewUploadSchema>,
  actor: AdminIdentity,
) {
  const upload = await db.query.enquiryUploads.findFirst({
    where: eq(enquiryUploads.id, uploadId),
  });
  if (!upload) throw new HttpError(404, 'not_found', 'Archivo no encontrado.');

  if (input.decision === 'reject') {
    const [row] = await db
      .update(enquiryUploads)
      .set({ reviewStatus: 'rejected', updatedAt: sql`now()` })
      .where(eq(enquiryUploads.id, uploadId))
      .returning();
    return row;
  }

  return db.transaction(async (tx) => {
    let promotedMediaId: string | null = null;
    if (input.promoteToBusinessId) {
      const exists = await tx.query.businesses.findFirst({
        where: eq(businesses.id, input.promoteToBusinessId),
        columns: { id: true },
      });
      if (!exists) throw new HttpError(422, 'invalid_business', 'El negocio indicado no existe.');
      const [media] = await tx
        .insert(businessMedia)
        .values({
          businessId: input.promoteToBusinessId,
          type: input.promoteAs ?? 'photo',
          source: 'enquiry',
          blobUrl: upload.blobUrl,
          blobPathname: upload.blobPathname,
          contentType: upload.contentType,
          byteSize: upload.byteSize,
          reviewStatus: 'approved',
          reviewedBy: actor.adminId,
          reviewedAt: sql`now()`,
        })
        .returning({ id: businessMedia.id });
      promotedMediaId = media.id;
    }
    const [row] = await tx
      .update(enquiryUploads)
      .set({ reviewStatus: 'approved', promotedMediaId, updatedAt: sql`now()` })
      .where(eq(enquiryUploads.id, uploadId))
      .returning();
    return row;
  });
}

// --- Retention (scope §37, run by the Phase 8 Vercel Cron job) --------------

/**
 * Soft-deletes enquiries past the retention period, then hard-deletes ones
 * past their grace period. An upload's blob is only removed if it was never
 * promoted to business media (a promoted image is now part of the business
 * record, not the enquiry's).
 */
export async function runEnquiryRetention() {
  const settings = await getSettings();

  const softDeleted = await db
    .update(enquiries)
    .set({
      softDeletedAt: sql`now()`,
      purgeAfter: sql`now() + make_interval(days => ${settings.enquiryDeletionGraceDays})`,
    })
    .where(
      and(
        isNull(enquiries.softDeletedAt),
        sql`${enquiries.createdAt} < now() - make_interval(months => ${settings.enquiryRetentionMonths})`,
      ),
    )
    .returning({ id: enquiries.id });

  const toPurge = await db
    .select({ id: enquiries.id })
    .from(enquiries)
    .where(and(sql`${enquiries.purgeAfter} is not null`, lt(enquiries.purgeAfter, sql`now()`)));

  for (const { id } of toPurge) {
    const uploads = await db.select().from(enquiryUploads).where(eq(enquiryUploads.enquiryId, id));
    for (const upload of uploads) {
      if (upload.promotedMediaId) continue;
      await deleteObject(upload.blobUrl).catch(() => {});
    }
    await db.delete(enquiries).where(eq(enquiries.id, id)); // cascades to enquiry_uploads
  }

  return { softDeleted: softDeleted.length, purged: toPurge.length };
}
