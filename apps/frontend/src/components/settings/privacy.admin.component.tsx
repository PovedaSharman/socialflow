'use client';

import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useDecisionModal } from '@gitroom/frontend/components/layout/new-modal';

type AuditRow = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  outcome: string;
  source: string;
  requestId: string | null;
  createdAt: string;
  actorUserId: string | null;
};

type ConsentRow = {
  id: string;
  purpose: string;
  version: string;
  granted: boolean;
  createdAt: string;
};

const useAuditEvents = () => {
  const fetch = useFetch();
  return useSWR<AuditRow[]>('privacy-audit', async () => {
    const response = await fetch('/user/privacy/audit');
    if (!response.ok) {
      throw new Error('Failed to load audit events');
    }
    return response.json();
  });
};

const useConsentPreferences = () => {
  const fetch = useFetch();
  return useSWR<ConsentRow[]>('privacy-consent', async () => {
    const response = await fetch('/user/privacy/consent');
    if (!response.ok) {
      throw new Error('Failed to load consent preferences');
    }
    return response.json();
  });
};

export const PrivacyAdminComponent = () => {
  const t = useT();
  const fetch = useFetch();
  const toaster = useToaster();
  const decision = useDecisionModal();
  const audit = useAuditEvents();
  const consent = useConsentPreferences();
  const [purpose, setPurpose] = useState('product-updates');
  const [version, setVersion] = useState('1');
  const [granted, setGranted] = useState(true);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const exportData = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch('/user/privacy/export');
      if (!response.ok) {
        throw new Error('export failed');
      }
      const payload = await response.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `organisation-export-${Date.now()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      await audit.mutate();
      toaster.show(
        t('privacy_export_ready', 'Organisation export downloaded.'),
        'success'
      );
    } catch {
      toaster.show(
        t('privacy_export_failed', 'Could not export organisation data.'),
        'warning'
      );
    } finally {
      setBusy(false);
    }
  }, [audit, fetch, t, toaster]);

  const saveConsent = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch('/user/privacy/consent', {
        method: 'POST',
        body: JSON.stringify({ purpose, version, granted }),
      });
      if (!response.ok) {
        throw new Error('consent failed');
      }
      await consent.mutate();
      await audit.mutate();
      toaster.show(
        t('privacy_consent_saved', 'Consent preference recorded.'),
        'success'
      );
    } catch {
      toaster.show(
        t('privacy_consent_failed', 'Could not record consent.'),
        'warning'
      );
    } finally {
      setBusy(false);
    }
  }, [audit, consent, fetch, granted, purpose, t, toaster, version]);

  const requestDeletion = useCallback(async () => {
    if (!password.trim()) {
      toaster.show(
        t(
          'privacy_password_required',
          'Enter your password to confirm deletion.'
        ),
        'warning'
      );
      return;
    }

    const approved = await decision.open({
      title: t('privacy_delete_title', 'Request organisation deletion'),
      description: t(
        'privacy_delete_body',
        'This records an audited deletion request. An operator must complete purge after retention rules are decided.'
      ),
      approveLabel: t('privacy_delete_confirm', 'Request deletion'),
      cancelLabel: t('cancel', 'Cancel'),
    });
    if (!approved) {
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/user/privacy/deletion-request', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        throw new Error('deletion failed');
      }
      setPassword('');
      await audit.mutate();
      toaster.show(
        t(
          'privacy_deletion_requested',
          'Deletion request recorded and audited.'
        ),
        'success'
      );
    } catch {
      toaster.show(
        t(
          'privacy_deletion_failed',
          'Deletion request failed. Check your password and try again.'
        ),
        'warning'
      );
    } finally {
      setBusy(false);
    }
  }, [audit, decision, fetch, password, t, toaster]);

  return (
    <div className="flex flex-col gap-[20px]">
      <div>
        <h3 className="text-[20px]">
          {t('privacy_admin', 'Privacy and audit')}
        </h3>
        <p className="text-[14px] opacity-80 mt-[6px]">
          {t(
            'privacy_admin_help',
            'Export organisation data, record consent and review recent audited admin actions. Secrets and full post bodies are excluded.'
          )}
        </p>
      </div>

      <div className="flex flex-col gap-[10px]">
        <button
          type="button"
          disabled={busy}
          className="border border-subtleBorder bg-btnPrimary text-white rounded-[8px] px-[14px] py-[10px] w-fit disabled:opacity-60"
          onClick={exportData}
        >
          {t('privacy_export', 'Download organisation export')}
        </button>
      </div>

      <div className="flex flex-col gap-[10px]">
        <h4 className="text-[16px]">{t('privacy_consent', 'Consent')}</h4>
        <label className="text-[13px]" htmlFor="privacy-purpose">
          {t('privacy_purpose', 'Purpose')}
        </label>
        <input
          id="privacy-purpose"
          className="bg-surface border border-subtleBorder rounded-[8px] px-[10px] py-[8px] text-content"
          value={purpose}
          onChange={(event) => setPurpose(event.target.value)}
        />
        <label className="text-[13px]" htmlFor="privacy-version">
          {t('privacy_version', 'Version')}
        </label>
        <input
          id="privacy-version"
          className="bg-surface border border-subtleBorder rounded-[8px] px-[10px] py-[8px] text-content"
          value={version}
          onChange={(event) => setVersion(event.target.value)}
        />
        <label
          className="text-[13px] flex items-center gap-[8px]"
          htmlFor="privacy-granted"
        >
          <input
            id="privacy-granted"
            type="checkbox"
            checked={granted}
            onChange={(event) => setGranted(event.target.checked)}
          />
          {t('privacy_granted', 'Granted')}
        </label>
        <button
          type="button"
          disabled={busy}
          className="border border-tableBorder rounded-[6px] px-[12px] py-[8px] w-fit"
          onClick={saveConsent}
        >
          {t('privacy_save_consent', 'Record consent')}
        </button>
        {consent.data?.length ? (
          <ul className="text-[13px] flex flex-col gap-[6px]">
            {consent.data.slice(0, 5).map((row) => (
              <li key={row.id}>
                {row.purpose} v{row.version}:{' '}
                {row.granted
                  ? t('privacy_yes', 'granted')
                  : t('privacy_no', 'withdrawn')}{' '}
                ({new Date(row.createdAt).toLocaleString()})
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="flex flex-col gap-[10px]">
        <h4 className="text-[16px]">
          {t('privacy_deletion', 'Deletion request')}
        </h4>
        <label className="text-[13px]" htmlFor="privacy-password">
          {t('privacy_reauth', 'Re-enter your password')}
        </label>
        <input
          id="privacy-password"
          type="password"
          autoComplete="current-password"
          className="bg-surface border border-subtleBorder rounded-[8px] px-[10px] py-[8px] text-content"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button
          type="button"
          disabled={busy}
          className="border border-tableBorder rounded-[6px] px-[12px] py-[8px] w-fit"
          onClick={requestDeletion}
        >
          {t('privacy_request_deletion', 'Request deletion')}
        </button>
      </div>

      <div className="flex flex-col gap-[10px]">
        <h4 className="text-[16px]">
          {t('privacy_audit_log', 'Recent audit')}
        </h4>
        {audit.isLoading ? (
          <p className="text-[13px]">{t('loading', 'Loading…')}</p>
        ) : audit.error ? (
          <p className="text-[13px]">
            {t('privacy_audit_failed', 'Could not load audit events.')}
          </p>
        ) : (
          <ul className="text-[13px] flex flex-col gap-[8px]">
            {(audit.data || []).slice(0, 20).map((row) => (
              <li key={row.id} className="border-b border-tableBorder pb-[6px]">
                <span>
                  {row.action} · {row.outcome} · {row.source}
                </span>
                <br />
                <span className="opacity-70">
                  {row.targetType}
                  {row.targetId ? `:${row.targetId}` : ''} ·{' '}
                  {new Date(row.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
            {!audit.data?.length ? (
              <li>{t('privacy_audit_empty', 'No audit events yet.')}</li>
            ) : null}
          </ul>
        )}
      </div>
    </div>
  );
};
