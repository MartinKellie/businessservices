'use client';

import { useEffect, useState } from 'react';
import { PREF } from '@/lib/preferences';
import {
  DEV_UI_LOCALE,
  PUBLIC_COPY,
  type DevUiLocale,
  type PublicCopy,
} from '@/lib/public-copy';
import { usePreference } from '@/lib/use-preference';

export function usePublicCopy(): {
  copy: PublicCopy;
  locale: DevUiLocale;
  setLocale: (next: DevUiLocale) => void;
} {
  const [stored, setStored] = usePreference(PREF.devUiLocale);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const locale: DevUiLocale = ready && DEV_UI_LOCALE && stored === 'en' ? 'en' : 'es';

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return {
    copy: PUBLIC_COPY[locale],
    locale,
    setLocale: setStored,
  };
}
