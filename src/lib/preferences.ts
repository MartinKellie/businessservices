/**
 * Local device preferences for the public directory. All keys are optional;
 * readers must tolerate missing or unreadable values (handoff §1).
 */

export const PREF = {
  area: 'pref.area',
  desktopSplit: 'pref.desktopSplit',
  desktopPane: 'pref.desktopPane',
  mobileView: 'pref.mobileView',
  theme: 'pref.theme',
} as const;

export type ThemePreference = 'system' | 'light' | 'dark';
export type DesktopPane = 'none' | 'map' | 'list';
export type MobileView = 'map' | 'list';

export function readPreference(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writePreference(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage may be blocked; the UI still works for the session.
  }
}

export function readThemePreference(): ThemePreference {
  const value = readPreference(PREF.theme);
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return 'system';
}

export function readDesktopSplit(): number {
  const raw = Number(readPreference(PREF.desktopSplit));
  if (Number.isFinite(raw) && raw >= 28 && raw <= 72) return raw;
  return 46;
}

export function readDesktopPane(): DesktopPane {
  const value = readPreference(PREF.desktopPane);
  if (value === 'map' || value === 'list' || value === 'none') return value;
  return 'none';
}

export function readMobileView(): MobileView {
  return readPreference(PREF.mobileView) === 'list' ? 'list' : 'map';
}
