import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth-guards';
import { handle } from '@/lib/http';
import { reviewEnquiryUpload, reviewUploadSchema } from '@/lib/services/enquiries';

const params = z.object({ id: z.string().uuid() });

/**
 * Review an enquiry image (scope §35). `approve` may optionally attach it to a
 * business as media (`promoteToBusinessId` + `promoteAs`).
 */
export const POST = handle(
  async (request: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const actor = await requireAdmin();
    const { id } = params.parse(await ctx.params);
    const upload = await reviewEnquiryUpload(
      id,
      reviewUploadSchema.parse(await request.json()),
      actor,
    );
    return NextResponse.json({ upload });
  },
);
