'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BoardButton,
  BoardField,
  BoardState,
  Flash,
  fieldClass,
} from '@/components/admin/admin-ui';
import { AdminApiError, adminGet, adminSend, type AdminUser } from '@/lib/admin-api';
import type { AdminRole } from '@/lib/roles';

export function UsersBoard() {
  const t = useTranslations('admin');
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<AdminRole>('editor');
  const [flash, setFlash] = useState<string | null>(null);

  function load() {
    adminGet<{ users: AdminUser[] }>('/api/admin/users')
      .then((data) => setUsers(data.users))
      .catch((err) =>
        setError(
          err instanceof AdminApiError && err.status === 403
            ? t('users.forbidden')
            : err instanceof AdminApiError
              ? err.message
              : t('common.error'),
        ),
      );
  }

  useEffect(load, [t]);

  if (error) return <BoardState kind="error" title={error} />;
  if (!users) return <BoardState kind="loading" title={t('common.loading')} />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="font-display text-3xl font-extrabold tracking-wide uppercase">
        {t('users.title')}
      </h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <BoardField label={t('users.email')}>
          <input className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </BoardField>
        <BoardField label={t('users.name')}>
          <input className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
        </BoardField>
        <BoardField label={t('users.role')}>
          <select
            className={fieldClass}
            value={role}
            onChange={(e) => setRole(e.target.value as AdminRole)}
          >
            <option value="editor">{t('shell.roleEditor')}</option>
            <option value="owner">{t('shell.roleOwner')}</option>
          </select>
        </BoardField>
      </div>
      {flash ? (
        <div className="mt-3">
          <Flash tone="err">{flash}</Flash>
        </div>
      ) : null}
      <div className="mt-3">
        <BoardButton
          invert
          onClick={async () => {
            setFlash(null);
            try {
              await adminSend('/api/admin/users', 'POST', {
                email,
                name: name || undefined,
                role,
              });
              setEmail('');
              setName('');
              load();
            } catch (err) {
              setFlash(err instanceof AdminApiError ? err.message : t('common.failed'));
            }
          }}
        >
          {t('users.add')}
        </BoardButton>
      </div>
      <ul className="mt-8">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rail/20 py-3"
          >
            <div>
              <p className="font-semibold">{user.name || user.email}</p>
              <p className="text-sm text-muted">
                {user.email} ·{' '}
                {user.role === 'owner' ? t('shell.roleOwner') : t('shell.roleEditor')}
                {user.isActive ? '' : ` · ${t('users.deactivate')}`}
              </p>
            </div>
            <div className="flex gap-2">
              <BoardButton
                onClick={async () => {
                  try {
                    await adminSend(`/api/admin/users/${user.id}`, 'PATCH', {
                      role: user.role === 'owner' ? 'editor' : 'owner',
                    });
                    load();
                  } catch (err) {
                    setFlash(err instanceof AdminApiError ? err.message : t('common.failed'));
                  }
                }}
              >
                {user.role === 'owner' ? t('shell.roleEditor') : t('shell.roleOwner')}
              </BoardButton>
              <BoardButton
                onClick={async () => {
                  try {
                    await adminSend(`/api/admin/users/${user.id}`, 'PATCH', {
                      isActive: !user.isActive,
                    });
                    load();
                  } catch (err) {
                    setFlash(err instanceof AdminApiError ? err.message : t('common.failed'));
                  }
                }}
              >
                {user.isActive ? t('users.deactivate') : t('users.activate')}
              </BoardButton>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
