import { env } from '@/env';

/**
 * Minimal Resend REST client. If `RESEND_API_KEY` / recipients are not
 * configured the call is a logged no-op, so local and preview environments work
 * without email set up.
 */
export async function sendEmail(opts: {
  subject: string;
  text: string;
  to?: string;
}): Promise<{ sent: boolean }> {
  const to = opts.to ?? env.ENQUIRY_NOTIFICATION_TO;
  const from = env.ENQUIRY_NOTIFICATION_FROM;
  if (!env.RESEND_API_KEY || !to || !from) {
    console.info('[email] skipped (not configured):', opts.subject);
    return { sent: false };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject: opts.subject, text: opts.text }),
  });
  if (!res.ok) {
    console.error('[email] send failed', res.status, await res.text().catch(() => ''));
    return { sent: false };
  }
  return { sent: true };
}
