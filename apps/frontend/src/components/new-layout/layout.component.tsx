'use client';

import React, { ReactNode, useCallback } from 'react';
import { Logo } from '@gitroom/frontend/components/new-layout/logo';
import { Plus_Jakarta_Sans } from 'next/font/google';
const ModeComponent = dynamic(
  () => import('@gitroom/frontend/components/layout/mode.component'),
  {
    ssr: false,
  }
);

import clsx from 'clsx';
import dynamic from 'next/dynamic';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useVariables } from '@gitroom/react/helpers/variable.context';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { CheckPayment } from '@gitroom/frontend/components/layout/check.payment';
import { ToolTip } from '@gitroom/frontend/components/layout/top.tip';
import { ShowMediaBoxModal } from '@gitroom/frontend/components/media/media.component';
import { ShowLinkedinCompany } from '@gitroom/frontend/components/launches/helpers/linkedin.component';
import { MediaSettingsLayout } from '@gitroom/frontend/components/launches/helpers/media.settings.component';
import { Toaster } from '@gitroom/react/toaster/toaster';
import { ShowPostSelector } from '@gitroom/frontend/components/post-url-selector/post.url.selector';
import { NewSubscription } from '@gitroom/frontend/components/layout/new.subscription';
import { Support } from '@gitroom/frontend/components/layout/support';
import { ContinueProvider } from '@gitroom/frontend/components/layout/continue.provider';
import { ContextWrapper } from '@gitroom/frontend/components/layout/user.context';
import { CopilotKit } from '@copilotkit/react-core';
import { MantineWrapper } from '@gitroom/react/helpers/mantine.wrapper';
import { Impersonate } from '@gitroom/frontend/components/layout/impersonate';
import { AnnouncementBanner } from '@gitroom/frontend/components/layout/announcement.banner';
import { Title } from '@gitroom/frontend/components/layout/title';
import { TopMenu } from '@gitroom/frontend/components/layout/top.menu';
import { LanguageComponent } from '@gitroom/frontend/components/layout/language.component';
import { ChromeExtensionComponent } from '@gitroom/frontend/components/layout/chrome.extension.component';
import NotificationComponent from '@gitroom/frontend/components/notifications/notification.component';
import { OrganizationSelector } from '@gitroom/frontend/components/layout/organization.selector';
import { StreakComponent } from '@gitroom/frontend/components/layout/streak.component';
import { PreConditionComponent } from '@gitroom/frontend/components/layout/pre-condition.component';
import { AttachToFeedbackIcon } from '@gitroom/frontend/components/new-layout/sentry.feedback.component';
import { FirstBillingComponent } from '@gitroom/frontend/components/billing/first.billing.component';
import { TrialTracker } from '@gitroom/frontend/components/layout/gtm.component';

const jakartaSans = Plus_Jakarta_Sans({
  weight: ['600', '500', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
});

export const LayoutComponent = ({ children }: { children: ReactNode }) => {
  const fetch = useFetch();

  const { backendUrl, billingEnabled, isGeneral } = useVariables();

  // Feedback icon component attaches Sentry feedback to a top-bar icon when DSN is present
  const searchParams = useSearchParams();
  const load = useCallback(async (path: string) => {
    return await (await fetch(path)).json();
  }, [fetch]);
  const { data: user, error, mutate } = useSWR('/user/self', load, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
  });

  if (!user && !error) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-canvas p-[24px] text-content"
        aria-busy="true"
      >
        <div role="status" className="w-full max-w-[320px] text-center">
          <div
            aria-hidden="true"
            className="mx-auto mb-[16px] h-[8px] w-full animate-pulse rounded-full bg-muted/20"
          />
          <span className="text-[14px] text-muted">Loading your workspace…</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-canvas p-[24px] text-content">
        <div
          role="alert"
          className="w-full max-w-[440px] rounded-[12px] border border-danger/35 bg-surface p-[24px] text-center"
        >
          <h1 className="text-[20px] font-[700]">Unable to load your workspace</h1>
          <p className="mt-[8px] text-[14px] text-muted">
            Check your connection and try again. Your work has not been changed.
          </p>
          <button
            type="button"
            onClick={() => void mutate()}
            className="mt-[20px] min-h-[44px] rounded-[8px] bg-brand px-[20px] font-[600] text-onBrand hover:bg-brandHover"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <ContextWrapper user={user}>
      <CopilotKit
        credentials="include"
        runtimeUrl={backendUrl + '/copilot/chat'}
        showDevConsole={false}
      >
        <MantineWrapper>
          <ToolTip />
          <Toaster />
          <TrialTracker />
          <CheckPayment check={searchParams.get('check') || ''} mutate={mutate}>
            <ShowMediaBoxModal />
            <ShowLinkedinCompany />
            <MediaSettingsLayout />
            <ShowPostSelector />
            <PreConditionComponent />
            <NewSubscription />
            <ContinueProvider />
            <div
              className={clsx(
                'flex flex-col min-h-screen min-w-screen text-newTextColor p-[12px] mobile:p-[8px] mobile:pb-[80px]',
                jakartaSans.className
              )}
            >
              <div>{user?.admin ? <Impersonate /> : <div />}</div>
              {user.tier === 'FREE' && isGeneral && billingEnabled ? (
                <FirstBillingComponent />
              ) : (
                <>
                  <AnnouncementBanner />
                  <div className="flex-1 flex gap-[8px] mobile:block">
                    <Support />
                    <nav
                      aria-label="Primary navigation"
                      className="flex flex-col bg-newBgColorInner w-[80px] rounded-[12px] mobile:fixed mobile:z-[100] mobile:bottom-[8px] mobile:inset-x-[8px] mobile:w-auto mobile:h-[64px] mobile:shadow-menu"
                    >
                      <div
                        id="left-menu"
                        className={clsx(
                          'fixed h-full w-[64px] start-[17px] flex flex-1 top-0 mobile:static mobile:w-full mobile:h-[64px]',
                          user?.admin &&
                            'pt-[60px] max-h-[1000px]:w-[500px] mobile:pt-0 mobile:w-full mobile:max-h-none'
                        )}
                      >
                        <div className="flex flex-col h-full gap-[32px] flex-1 py-[12px] mobile:flex-row mobile:gap-[4px] mobile:p-[4px] mobile:overflow-x-auto">
                          <div className="mobile:hidden">
                            <Logo />
                          </div>
                          <TopMenu />
                        </div>
                      </div>
                    </nav>
                    <main className="flex-1 bg-newBgLineColor rounded-[12px] mobile:rounded-[10px] overflow-hidden flex flex-col gap-[1px] blurMe">
                      <div className="flex bg-newBgColorInner h-[80px] px-[20px] items-center mobile:h-[56px] mobile:px-[12px]">
                        <div className="text-[24px] font-[600] flex flex-1 mobile:text-[20px]">
                          <Title />
                        </div>
                        <div className="flex gap-[20px] text-textItemBlur mobile:gap-[8px] mobile:max-w-[62vw] mobile:overflow-x-auto">
                          <StreakComponent />
                          <div className="w-[1px] h-[20px] bg-blockSeparator" />
                          <OrganizationSelector />
                          <div className="hover:text-newTextColor">
                            <ModeComponent />
                          </div>
                          <div className="w-[1px] h-[20px] bg-blockSeparator" />
                          <LanguageComponent />
                          <ChromeExtensionComponent />
                          <div className="w-[1px] h-[20px] bg-blockSeparator" />
                          <AttachToFeedbackIcon />
                          <NotificationComponent />
                        </div>
                      </div>
                      <div className="flex flex-1 gap-[1px]">{children}</div>
                    </main>
                  </div>
                </>
              )}
            </div>
          </CheckPayment>
        </MantineWrapper>
      </CopilotKit>
    </ContextWrapper>
  );
};
