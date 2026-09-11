'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { fill } from '@/lib/public-copy';
import { PREF, type ThemePreference } from '@/lib/preferences';
import { usePreference } from '@/lib/use-preference';
import { usePublicCopy } from '@/lib/use-public-copy';

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
  const { copy } = usePublicCopy();
  const theme = asTheme(stored);
  const label =
    theme === 'dark' ? copy.themeDark : theme === 'light' ? copy.themeLight : copy.themeSystem;

  function cycle() {
    const next: ThemePreference = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setStored(next);
    applyTheme(next);
  }

  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <button
      type="button"
      onClick={cycle}
      className="inline-flex h-9 items-center gap-2 border border-rail/40 px-2.5 text-sm hover:bg-ink hover:text-board"
      aria-label={fill(copy.themeAria, { label })}
    >
      <Icon size={16} strokeWidth={2} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
