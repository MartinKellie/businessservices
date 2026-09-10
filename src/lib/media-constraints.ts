/**
 * Upload limits for business media and enquiry image uploads (scope §17, §35).
 * Exact values are provisional and may move to System Settings later.
 */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AcceptedImageType = (typeof ACCEPTED_IMAGE_TYPES)[number];

export function isAcceptedImageType(value: string): value is AcceptedImageType {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(value);
}

export const ACCEPTED_EXTENSION: Record<AcceptedImageType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
