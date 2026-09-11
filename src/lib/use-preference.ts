'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { readPreference, writePreference } from '@/lib/preferences';

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  window.addEventListener('storage', onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener('storage', onStoreChange);
  };
}

function emit() {
  for (const listener of listeners) listener();
}

/** True once mounted on the client. Server/first-paint snapshot is `false` (no mismatch). */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export function usePreference(key: string): [string | null, (value: string) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => readPreference(key),
    () => null,
  );
  const setValue = useCallback(
    (next: string) => {
      writePreference(key, next);
      emit();
    },
    [key],
  );
  return [value, setValue];
}
