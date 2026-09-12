'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { PREF, parseCookieConsent } from '@/lib/preferences';
import { useHydrated, usePreference } from '@/lib/use-preference';
import { usePublicCopy } from '@/lib/use-public-copy';

interface CookieConsentContextValue {
  ready: boolean;
  decided: boolean;
  panelOpen: boolean;
  accept: () => void;
  openPanel: () => void;
  closePanel: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [raw, setRaw] = usePreference(PREF.cookies);
  const ready = useHydrated();
  const [panelOpen, setPanelOpen] = useState(false);

  const decided = parseCookieConsent(raw) != null;

  const accept = useCallback(() => {
    setRaw(JSON.stringify({ necessary: true, decidedAt: new Date().toISOString() }));
    setPanelOpen(false);
  }, [setRaw]);

  const value = useMemo(
    () => ({
      ready,
      decided,
      panelOpen,
      accept,
      openPanel: () => setPanelOpen(true),
      closePanel: () => setPanelOpen(false),
    }),
    [accept, decided, panelOpen, ready],
  );

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent(): CookieConsentContextValue {
  const value = useContext(CookieConsentContext);
  if (!value) throw new Error('useCookieConsent must be used within CookieConsentProvider');
  return value;
}

export function CookieDock() {
  const { copy } = usePublicCopy();
  const { ready, decided, panelOpen, accept, closePanel, openPanel } = useCookieConsent();

  if (!ready) return null;
  if (decided && !panelOpen) return null;

  return (
    <div
      className="border-t-2 border-rail bg-board px-4 py-3 sm:px-6"
      role={panelOpen ? 'dialog' : 'region'}
      aria-label={panelOpen ? copy.cookiePanelTitle : copy.cookies}
    >
      {panelOpen ? (
        <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="font-display text-xl font-extrabold uppercase tracking-wide">
              {copy.cookiePanelTitle}
            </p>
            <p className="mt-3 font-semibold">{copy.cookieNecessary}</p>
            <p className="mt-1 text-sm text-muted">{copy.cookieNecessaryHint}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={accept}
              className="bg-ink px-5 py-2.5 font-display text-sm font-extrabold uppercase tracking-wide text-board hover:bg-signal hover:text-signal-ink"
            >
              {copy.cookieSave}
            </button>
            {decided ? (
              <button
                type="button"
                onClick={closePanel}
                className="border border-rail/40 px-5 py-2.5 text-sm hover:bg-ink hover:text-board"
              >
                {copy.cookieClose}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">{copy.cookieBanner}</p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={accept}
              className="bg-ink px-5 py-2.5 font-display text-sm font-extrabold uppercase tracking-wide text-board hover:bg-signal hover:text-signal-ink"
            >
              {copy.cookieAccept}
            </button>
            <button
              type="button"
              onClick={openPanel}
              className="border border-rail/40 px-5 py-2.5 text-sm hover:bg-ink hover:text-board"
            >
              {copy.cookiePrefs}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
