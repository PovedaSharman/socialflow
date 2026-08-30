'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@gitroom/frontend/components/layout/user.context';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { useIntegrationList } from '@gitroom/frontend/components/launches/helpers/use.integration.list';

type ChecklistStepId =
  | 'connect-channel'
  | 'accessible-media'
  | 'first-schedule'
  | 'mcp-optional'
  | 'help';

type ChecklistState = {
  dismissed: boolean;
  completed: Partial<Record<ChecklistStepId, boolean>>;
};

const STORAGE_PREFIX = 'sf-onboarding-checklist:';

const defaultState = (): ChecklistState => ({
  dismissed: false,
  completed: {},
});

function readState(orgId: string): ChecklistState {
  if (typeof window === 'undefined') {
    return defaultState();
  }
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${orgId}`);
    if (!raw) {
      return defaultState();
    }
    const parsed = JSON.parse(raw) as ChecklistState;
    return {
      dismissed: Boolean(parsed.dismissed),
      completed: parsed.completed || {},
    };
  } catch {
    return defaultState();
  }
}

function writeState(orgId: string, next: ChecklistState) {
  window.localStorage.setItem(
    `${STORAGE_PREFIX}${orgId}`,
    JSON.stringify(next)
  );
}

/**
 * Persistent first-run checklist. Progress is stored per organisation in
 * localStorage so it survives reloads without inventing a new API.
 */
export const OnboardingChecklist: FC = () => {
  const user = useUser();
  const t = useT();
  const { data: integrations } = useIntegrationList();
  const orgId = user?.orgId || '';
  const [state, setState] = useState<ChecklistState>(defaultState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!orgId) {
      return;
    }
    setState(readState(orgId));
    setReady(true);
  }, [orgId]);

  const hasChannel = useMemo(
    () =>
      Boolean(
        integrations?.some(
          (integration: { disabled?: boolean }) => !integration.disabled
        )
      ),
    [integrations]
  );

  const persist = useCallback(
    (next: ChecklistState) => {
      if (!orgId) {
        return;
      }
      setState(next);
      writeState(orgId, next);
    },
    [orgId]
  );

  const toggle = useCallback(
    (id: ChecklistStepId) => {
      persist({
        ...state,
        completed: {
          ...state.completed,
          [id]: !state.completed[id],
        },
      });
    },
    [persist, state]
  );

  const dismiss = useCallback(() => {
    persist({ ...state, dismissed: true });
  }, [persist, state]);

  const restart = useCallback(() => {
    persist(defaultState());
  }, [persist]);

  if (!ready || !orgId) {
    return null;
  }

  if (state.dismissed) {
    return (
      <button
        type="button"
        className="self-start text-[13px] underline text-content min-h-[44px] px-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-btnPrimary"
        onClick={restart}
      >
        {t('restart_checklist', 'Restart getting started')}
      </button>
    );
  }

  const steps: Array<{
    id: ChecklistStepId;
    label: string;
    href: string;
    done: boolean;
  }> = [
    {
      id: 'connect-channel',
      label: t('checklist_connect', 'Connect a channel'),
      href: '/help?article=connect-channel',
      done: hasChannel || Boolean(state.completed['connect-channel']),
    },
    {
      id: 'accessible-media',
      label: t('checklist_media', 'Add accessible media descriptions'),
      href: '/help?article=accessible-media',
      done: Boolean(state.completed['accessible-media']),
    },
    {
      id: 'first-schedule',
      label: t('checklist_schedule', 'Schedule your first post'),
      href: '/help?article=first-schedule',
      done: Boolean(state.completed['first-schedule']),
    },
    {
      id: 'mcp-optional',
      label: t(
        'checklist_mcp',
        'Optional: create and revoke an MCP credential'
      ),
      href: '/help?article=mcp-credentials',
      done: Boolean(state.completed['mcp-optional']),
    },
    {
      id: 'help',
      label: t('checklist_help', 'Open Help when you need recovery guidance'),
      href: '/help',
      done: Boolean(state.completed['help']),
    },
  ];

  return (
    <section
      aria-labelledby="onboarding-checklist-title"
      className="border border-subtleBorder bg-surface rounded-[12px] p-[16px] flex flex-col gap-[12px]"
    >
      <div className="flex items-start justify-between gap-[12px]">
        <div>
          <h2
            id="onboarding-checklist-title"
            className="text-[16px] font-[600] text-content"
          >
            {t('getting_started', 'Getting started')}
          </h2>
          <p className="text-[13px] text-muted mt-[4px]">
            {t(
              'checklist_intro',
              'A short path to your first scheduled post. Progress stays on this device for your organisation.'
            )}
          </p>
        </div>
        <button
          type="button"
          className="text-[13px] underline text-content min-h-[44px] px-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-btnPrimary"
          onClick={dismiss}
        >
          {t('dismiss_checklist', 'Dismiss')}
        </button>
      </div>
      <ul className="flex flex-col gap-[8px]">
        {steps.map((step) => (
          <li key={step.id} className="flex items-start gap-[10px]">
            <input
              id={`checklist-${step.id}`}
              type="checkbox"
              className="mt-[4px] h-[18px] w-[18px]"
              checked={step.done}
              onChange={() => toggle(step.id)}
              aria-describedby={`checklist-link-${step.id}`}
            />
            <div className="flex flex-col gap-[2px]">
              <label
                htmlFor={`checklist-${step.id}`}
                className="text-[14px] text-content cursor-pointer"
              >
                {step.label}
              </label>
              <Link
                id={`checklist-link-${step.id}`}
                href={step.href}
                className="text-[13px] text-btnPrimary underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-btnPrimary"
              >
                {t('open_guidance', 'Open guidance')}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
