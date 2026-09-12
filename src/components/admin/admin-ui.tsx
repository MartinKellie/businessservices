'use client';

import type { ReactNode } from 'react';

export function BoardButton({
  children,
  invert = false,
  danger = false,
  signal = false,
  disabled,
  pending,
  type = 'button',
  onClick,
  className = '',
}: {
  children: ReactNode;
  invert?: boolean;
  danger?: boolean;
  signal?: boolean;
  disabled?: boolean;
  pending?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  className?: string;
}) {
  const tone = danger
    ? 'bg-warn text-warn-ink hover:opacity-90'
    : signal
      ? 'bg-signal text-signal-ink hover:opacity-90'
      : invert
        ? 'bg-ink text-board hover:bg-signal hover:text-signal-ink'
        : 'border border-rail/40 hover:bg-ink hover:text-board';

  return (
    <button
      type={type}
      disabled={disabled || pending}
      onClick={onClick}
      className={`inline-flex items-center justify-center px-4 py-2 font-display text-sm font-extrabold tracking-wide uppercase disabled:opacity-40 ${tone} ${className}`}
    >
      {children}
    </button>
  );
}

export function BoardField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <div className="mt-1">{children}</div>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </label>
  );
}

export const fieldClass =
  'w-full border-0 border-b border-rail/50 bg-transparent py-2 px-0 text-ink outline-none focus-visible:border-ink';

export function Flash({ tone, children }: { tone: 'ok' | 'err' | 'warn'; children: ReactNode }) {
  const cls =
    tone === 'ok'
      ? 'bg-ink text-board'
      : tone === 'warn'
        ? 'bg-warn text-warn-ink'
        : 'border border-warn text-warn';
  return (
    <p className={`px-3 py-2 text-sm ${cls}`} role={tone === 'err' ? 'alert' : 'status'}>
      {children}
    </p>
  );
}

export function BoardState({
  kind,
  title,
  action,
}: {
  kind: 'loading' | 'empty' | 'error';
  title: string;
  action?: ReactNode;
}) {
  if (kind === 'loading') {
    return (
      <div className="space-y-2 p-4" aria-busy="true">
        <div className="menu-skeleton h-8" />
        <div className="menu-skeleton h-8" />
        <div className="menu-skeleton h-8" />
        <span className="sr-only">{title}</span>
      </div>
    );
  }
  return (
    <div className="px-4 py-10 text-muted">
      <p>{title}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`px-3 py-1.5 text-sm ${active ? 'bg-ink text-board' : 'border border-rail/40 hover:bg-ink hover:text-board'}`}
    >
      {children}
    </button>
  );
}
