'use client';

import { FormProvider, useForm } from 'react-hook-form';
import { Button } from '@gitroom/react/form/button';
import { Input } from '@gitroom/react/form/input';
import {
  Alert,
  Badge,
  EmptyState,
  Skeleton,
} from '@gitroom/react/design-system/status';
import ModeComponent from '@gitroom/frontend/components/layout/mode.component';

const swatches = [
  ['Canvas', 'bg-canvas'],
  ['Surface', 'bg-surface'],
  ['Elevated', 'bg-elevated'],
  ['Primary', 'bg-brand'],
  ['Success', 'bg-success'],
  ['Warning', 'bg-warning'],
  ['Error', 'bg-danger'],
  ['Information', 'bg-info'],
] as const;

export function DesignSystemShowcase() {
  const form = useForm({ defaultValues: { example: '' } });

  return (
    <FormProvider {...form}>
      <div className="h-full w-full overflow-y-auto bg-canvas p-[32px] text-content mobile:p-[16px]">
        <header className="mx-auto flex max-w-[1120px] items-start justify-between gap-[24px]">
          <div>
            <Badge tone="info">Internal reference</Badge>
            <h1 className="mt-[12px] text-[32px] font-[700] tracking-[-0.03em] mobile:text-[26px]">
              SocialFlow design system
            </h1>
            <p className="mt-[8px] max-w-[64ch] text-[15px] text-muted">
              Semantic tokens and reusable states for calm, accessible social
              operations.
            </p>
          </div>
          <ModeComponent />
        </header>

        <div className="mx-auto mt-[32px] grid max-w-[1120px] gap-[24px]">
          <ShowcaseSection title="Colour tokens">
            <div className="grid grid-cols-4 gap-[12px] tablet:grid-cols-2 xs:grid-cols-1">
              {swatches.map(([name, className]) => (
                <div
                  key={name}
                  className="overflow-hidden rounded-[10px] border border-subtleBorder bg-surface"
                >
                  <div className={`h-[72px] ${className}`} aria-hidden="true" />
                  <div className="px-[12px] py-[10px] text-[13px] font-[600]">
                    {name}
                  </div>
                </div>
              ))}
            </div>
          </ShowcaseSection>

          <div className="grid grid-cols-2 gap-[24px] mobile:grid-cols-1">
            <ShowcaseSection title="Actions">
              <div className="flex flex-wrap gap-[12px]">
                <Button>Primary action</Button>
                <Button secondary>Secondary action</Button>
                <Button disabled>Disabled</Button>
                <Button loading>Saving</Button>
              </div>
            </ShowcaseSection>

            <ShowcaseSection title="Form fields">
              <div className="grid gap-[16px]">
                <Input
                  label="Workspace name"
                  name="example"
                  placeholder="Acme social team"
                />
                <Input
                  label="Publishing domain"
                  name="error-example"
                  error="Enter a verified domain"
                  placeholder="social.example.com"
                />
              </div>
            </ShowcaseSection>
          </div>

          <ShowcaseSection title="Status and feedback">
            <div className="mb-[16px] flex flex-wrap gap-[8px]">
              <Badge>Draft</Badge>
              <Badge tone="info">Scheduled</Badge>
              <Badge tone="success">Published</Badge>
              <Badge tone="warning">Approval needed</Badge>
              <Badge tone="danger">Failed</Badge>
            </div>
            <div className="grid grid-cols-2 gap-[12px] mobile:grid-cols-1">
              <Alert title="Ready to schedule" tone="success">
                All selected channels passed validation.
              </Alert>
              <Alert title="Connection needs attention" tone="danger">
                Reconnect the account before its next scheduled post.
              </Alert>
            </div>
          </ShowcaseSection>

          <div className="grid grid-cols-2 gap-[24px] mobile:grid-cols-1">
            <ShowcaseSection title="Loading state">
              <Skeleton label="Loading scheduled posts" />
            </ShowcaseSection>
            <ShowcaseSection title="Empty state">
              <EmptyState
                title="No posts scheduled"
                description="Create a post or import a draft to start your publishing calendar."
                action={<Button>Create a post</Button>}
              />
            </ShowcaseSection>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}

function ShowcaseSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[12px] border border-subtleBorder bg-surface p-[20px] shadow-sm">
      <h2 className="mb-[16px] text-[18px] font-[600]">{title}</h2>
      {children}
    </section>
  );
}
