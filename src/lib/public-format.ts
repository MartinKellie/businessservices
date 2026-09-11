/** Spanish labels and contact URLs for the public directory. */

export const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function statusLabel(status: string): string | null {
  if (status === 'temporarily_closed') return 'Temporalmente cerrado';
  if (status === 'relocated') return 'Movido';
  if (status === 'permanently_closed') return 'Cerrado definitivamente';
  return null;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} km`;
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/\s+/g, '')}`;
}

export function whatsappHref(whatsapp: string): string {
  return `https://wa.me/${digitsOnly(whatsapp)}`;
}

export function websiteHref(website: string): string {
  if (/^https?:\/\//i.test(website)) return website;
  return `https://${website}`;
}

export function instagramHref(instagram: string): string {
  if (/^https?:\/\//i.test(instagram)) return instagram;
  return `https://instagram.com/${instagram.replace(/^@/, '')}`;
}

export function facebookHref(facebook: string): string {
  if (/^https?:\/\//i.test(facebook)) return facebook;
  return `https://facebook.com/${facebook}`;
}

export function formatHour(value: string): string {
  return value.length >= 5 ? value.slice(0, 5) : value;
}
