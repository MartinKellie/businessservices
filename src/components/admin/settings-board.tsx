'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BoardButton, BoardField, BoardState, Flash, fieldClass } from '@/components/admin/admin-ui';
import { AdminApiError, adminGet, adminSend, type AdminSettings } from '@/lib/admin-api';

export function SettingsBoard() {
  const t = useTranslations('admin');
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [flash, setFlash] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    adminGet<{ settings: AdminSettings }>('/api/admin/settings')
      .then((data) => setSettings(data.settings))
      .catch((err) => {
        setError(
          err instanceof AdminApiError && err.status === 403
            ? t('settings.forbidden')
            : err instanceof AdminApiError
              ? err.message
              : t('common.error'),
        );
      });
  }, [t]);

  if (error) return <BoardState kind="error" title={error} />;
  if (!settings) return <BoardState kind="loading" title={t('common.loading')} />;

  function toggle<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">
        {t('settings.title')}
      </h1>
      <div className="mt-6 space-y-4">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="board-check"
            checked={settings.maintenanceMode}
            onChange={(e) => toggle('maintenanceMode', e.target.checked)}
          />
          {t('settings.maintenance')}
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="board-check"
            checked={settings.announcementEnabled}
            onChange={(e) => toggle('announcementEnabled', e.target.checked)}
          />
          {t('settings.announcementOn')}
        </label>
        <BoardField label={t('settings.announcementText')}>
          <textarea
            className={`${fieldClass} min-h-20`}
            value={settings.announcementText}
            onChange={(e) => toggle('announcementText', e.target.value)}
          />
        </BoardField>
        <BoardField label={t('settings.radius')}>
          <input
            type="number"
            min={100}
            max={50000}
            className={fieldClass}
            value={settings.nearMeRadiusMeters}
            onChange={(e) => toggle('nearMeRadiusMeters', Number(e.target.value))}
          />
        </BoardField>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="board-check"
            checked={settings.publicLastUpdatedVisible}
            onChange={(e) => toggle('publicLastUpdatedVisible', e.target.checked)}
          />
          {t('settings.lastUpdated')}
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="board-check"
            checked={settings.approvalRequiredCategories}
            onChange={(e) => toggle('approvalRequiredCategories', e.target.checked)}
          />
          {t('settings.approveCategories')}
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="board-check"
            checked={settings.approvalRequiredProducts}
            onChange={(e) => toggle('approvalRequiredProducts', e.target.checked)}
          />
          {t('settings.approveProducts')}
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            className="board-check"
            checked={settings.approvalRequiredSynonyms}
            onChange={(e) => toggle('approvalRequiredSynonyms', e.target.checked)}
          />
          {t('settings.approveSynonyms')}
        </label>
        <BoardField label={t('settings.retention')}>
          <input
            type="number"
            min={1}
            max={60}
            className={fieldClass}
            value={settings.enquiryRetentionMonths}
            onChange={(e) => toggle('enquiryRetentionMonths', Number(e.target.value))}
          />
        </BoardField>
        <BoardField label={t('settings.grace')}>
          <input
            type="number"
            min={1}
            max={365}
            className={fieldClass}
            value={settings.enquiryDeletionGraceDays}
            onChange={(e) => toggle('enquiryDeletionGraceDays', Number(e.target.value))}
          />
        </BoardField>
        <BoardField label={t('settings.privacyVersion')}>
          <input
            className={fieldClass}
            value={settings.privacyPolicyVersion}
            onChange={(e) => toggle('privacyPolicyVersion', e.target.value)}
          />
        </BoardField>
        {flash ? <Flash tone={flash.tone}>{flash.text}</Flash> : null}
        <BoardButton
          invert
          pending={pending}
          onClick={async () => {
            setPending(true);
            setFlash(null);
            try {
              const { settings: next } = await adminSend<{ settings: AdminSettings }>(
                '/api/admin/settings',
                'PATCH',
                settings,
              );
              setSettings(next);
              setFlash({ tone: 'ok', text: t('common.saved') });
            } catch (err) {
              setFlash({
                tone: 'err',
                text: err instanceof AdminApiError ? err.message : t('common.failed'),
              });
            } finally {
              setPending(false);
            }
          }}
        >
          {t('common.save')}
        </BoardButton>
      </div>
    </div>
  );
}
