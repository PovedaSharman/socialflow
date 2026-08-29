'use client';

import { useCallback, useState } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useDecisionModal } from '@gitroom/frontend/components/layout/new-modal';
import { DEFAULT_MCP_SCOPES } from '@gitroom/nestjs-libraries/chat/mcp.scopes';
import copy from 'copy-to-clipboard';

type ApiCredentialRow = {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  createdByUserId: string;
};

const useApiCredentials = () => {
  const fetch = useFetch();
  return useSWR<ApiCredentialRow[]>('/user/api-credentials', async () => {
    const response = await fetch('/user/api-credentials');
    if (!response.ok) {
      throw new Error('Failed to load API credentials');
    }
    return response.json();
  });
};

export const ScopedApiCredentialsSection = () => {
  const t = useT();
  const fetch = useFetch();
  const toaster = useToaster();
  const decision = useDecisionModal();
  const { data, error, isLoading, mutate } = useApiCredentials();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [oneTimeSecret, setOneTimeSecret] = useState('');
  const [nameError, setNameError] = useState('');

  const createCredential = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(
        t('credential_name_required', 'Enter a name for this credential.')
      );
      return;
    }
    setNameError('');
    setCreating(true);
    try {
      const response = await fetch('/user/api-credentials', {
        method: 'POST',
        body: JSON.stringify({
          name: trimmed,
          scopes: [...DEFAULT_MCP_SCOPES],
        }),
      });
      if (!response.ok) {
        throw new Error('create failed');
      }
      const created = await response.json();
      setOneTimeSecret(created.secret || '');
      setName('');
      await mutate();
      toaster.show(
        t(
          'credential_created_once',
          'Credential created. Copy the secret now; it will not be shown again.'
        ),
        'success'
      );
    } catch {
      toaster.show(
        t('credential_create_failed', 'Could not create the credential.'),
        'warning'
      );
    } finally {
      setCreating(false);
    }
  }, [fetch, mutate, name, t, toaster]);

  const revokeCredential = useCallback(
    async (id: string, label: string) => {
      const approved = await decision.open({
        title: t('revoke_credential', 'Revoke credential?'),
        description: t(
          'revoke_credential_description',
          `This permanently revokes “${label}”. Clients using it will lose access.`
        ),
        approveLabel: t('revoke', 'Revoke'),
        cancelLabel: t('cancel', 'Cancel'),
      });
      if (!approved) return;
      const response = await fetch(`/user/api-credentials/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        toaster.show(
          t('credential_revoke_failed', 'Could not revoke the credential.'),
          'warning'
        );
        return;
      }
      await mutate();
      toaster.show(t('credential_revoked', 'Credential revoked.'), 'success');
    },
    [decision, fetch, mutate, t, toaster]
  );

  return (
    <div className="bg-newBgColorInnerInner rounded-[12px] border border-newBorder overflow-hidden">
      <div className="bg-newBgColorInner px-[20px] py-[14px] border-b border-newBorder">
        <div className="text-[15px] font-[600]">
          {t('scoped_api_credentials', 'Scoped API credentials')}
        </div>
        <div className="text-[13px] text-customColor18 mt-[2px]">
          {t(
            'scoped_api_credentials_help',
            'Create hashed Bearer credentials with default-deny publish and media scopes. The secret is shown once.'
          )}
        </div>
      </div>
      <div className="p-[20px] flex flex-col gap-[16px]">
        <div className="flex flex-col gap-[8px]">
          <label
            htmlFor="api-credential-name"
            className="text-[13px] font-[600] text-customColor18"
          >
            {t('credential_name', 'Name')}
          </label>
          <div className="flex flex-wrap gap-[8px]">
            <input
              id="api-credential-name"
              type="text"
              value={name}
              maxLength={100}
              aria-invalid={Boolean(nameError)}
              aria-describedby="api-credential-name-error"
              onChange={(event) => {
                setName(event.target.value);
                if (nameError) setNameError('');
              }}
              placeholder={t(
                'credential_name_placeholder',
                'e.g. Cursor production'
              )}
              className="flex-1 min-w-[200px] px-3 h-[44px] bg-newBgColorInner border border-newBorder rounded-[8px] text-textColor"
            />
            <button
              type="button"
              disabled={creating}
              onClick={createCredential}
              className="cursor-pointer px-[16px] h-[44px] bg-[#612BD3] hover:bg-[#5520CB] disabled:opacity-60 text-white transition-colors rounded-[8px] text-[13px] font-[600]"
            >
              {creating
                ? t('creating', 'Creating…')
                : t('create_credential', 'Create credential')}
            </button>
          </div>
          <div
            id="api-credential-name-error"
            role="alert"
            className="min-h-[20px] text-sm text-red-500"
          >
            {nameError}
          </div>
        </div>

        {oneTimeSecret ? (
          <div className="flex flex-col gap-[8px] border border-newBorder rounded-[8px] p-[16px] bg-newBgColorInner">
            <div className="text-[13px] font-[600]">
              {t('one_time_secret', 'One-time secret')}
            </div>
            <p className="text-[12px] text-customColor18">
              {t(
                'one_time_secret_warning',
                'Copy this value now. SocialFlow stores only a hash and will not show the secret again.'
              )}
            </p>
            <pre className="text-[13px] whitespace-pre-wrap break-all">
              {oneTimeSecret}
            </pre>
            <div className="flex gap-[8px]">
              <button
                type="button"
                className="cursor-pointer px-[16px] h-[36px] bg-btnSimple hover:bg-boxHover transition-colors rounded-[8px] text-[13px] font-[600]"
                onClick={() => {
                  copy(oneTimeSecret);
                  toaster.show(t('copied', 'Copied'), 'success');
                }}
              >
                {t('copy_secret', 'Copy secret')}
              </button>
              <button
                type="button"
                className="cursor-pointer px-[16px] h-[36px] bg-btnSimple hover:bg-boxHover transition-colors rounded-[8px] text-[13px] font-[600]"
                onClick={() => setOneTimeSecret('')}
              >
                {t('dismiss_secret', 'I have copied it')}
              </button>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-[13px] text-customColor18">
            {t('loading_credentials', 'Loading credentials…')}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="text-[13px] text-red-500">
            {t(
              'credentials_load_failed',
              'Could not load credentials. Apply the ApiCredential schema on an approved host if this is a new environment.'
            )}
          </p>
        ) : null}

        <ul className="flex flex-col gap-[8px]">
          {(data || []).map((credential) => (
            <li
              key={credential.id}
              className="flex flex-wrap items-center justify-between gap-[12px] border border-newBorder rounded-[8px] px-[16px] py-[12px]"
            >
              <div className="flex flex-col gap-[2px]">
                <div className="text-[14px] font-[600]">{credential.name}</div>
                <div className="text-[12px] text-customColor18">
                  {credential.prefix}… · {credential.scopes.join(', ')}
                  {credential.revokedAt ? ` · ${t('revoked', 'revoked')}` : ''}
                </div>
              </div>
              {!credential.revokedAt ? (
                <button
                  type="button"
                  className="cursor-pointer px-[16px] h-[36px] bg-btnSimple hover:bg-boxHover transition-colors rounded-[8px] text-[13px] font-[600]"
                  onClick={() =>
                    revokeCredential(credential.id, credential.name)
                  }
                >
                  {t('revoke', 'Revoke')}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
