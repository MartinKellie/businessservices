import { del, put } from '@vercel/blob';
import { env } from '@/env';

/**
 * Thin wrapper around Vercel Blob so services depend on a small surface and
 * tests can mock it. All objects are public (images shown on the directory) but
 * only surface publicly once an admin approves the `business_media` row.
 */
export type StoredObject = { url: string; pathname: string; contentType: string };

export async function putObject(
  pathname: string,
  body: ArrayBuffer | Buffer | Blob,
  contentType: string,
): Promise<StoredObject> {
  const result = await put(pathname, body, {
    access: 'public',
    contentType,
    token: env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: true,
  });
  return { url: result.url, pathname: result.pathname, contentType };
}

export async function deleteObject(pathnameOrUrl: string): Promise<void> {
  await del(pathnameOrUrl, { token: env.BLOB_READ_WRITE_TOKEN });
}
