'use client';

import { Sun } from 'lucide-react';
import { PREF, type ThemePreference } from '@/lib/preferences';
import { usePreference } from '@/lib/use-preference';

function applyTheme(theme: ThemePreference) {
  const dark =
    theme === 'dark' ||
    (theme !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

function asTheme(value: string | null): ThemePreference {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return 'system';
}

export function ThemeToggle() {
  const [stored, setStored] = usePreference(PREF.theme);
  const theme = asTheme(stored);

  function cycle() {
    const next: ThemePreference = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setStored(next);
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      className="inline-flex items-center gap-2 border border-rail/40 px-2.5 py-1.5 text-sm text-ink hover:bg-ink hover:text-board"
      aria-label="Cambiar tema"
    >
      <Sun size={16} strokeWidth={2} aria-hidden="true" />
      <span className="hidden sm:inline">Tema</span>
    </button>
  );
}
