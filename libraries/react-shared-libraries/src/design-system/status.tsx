import { ReactNode } from 'react';
import clsx from 'clsx';

export type SemanticTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export const toneClasses: Record<SemanticTone, string> = {
  neutral: 'border-subtleBorder bg-elevated text-content',
  info: 'border-info/35 bg-info/10 text-info',
  success: 'border-success/35 bg-success/10 text-success',
  warning: 'border-warning/35 bg-warning/10 text-warning',
  danger: 'border-danger/35 bg-danger/10 text-danger',
};

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: SemanticTone;
}) {
  return (
    <span
      className={clsx(
        'inline-flex min-h-[24px] items-center rounded-full border px-[10px] py-[2px] text-[12px] font-[600]',
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  );
}

export function Alert({
  title,
  children,
  tone = 'info',
}: {
  title: string;
  children: ReactNode;
  tone?: SemanticTone;
}) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={clsx('rounded-[12px] border p-[16px]', toneClasses[tone])}
    >
      <div className="font-[600]">{title}</div>
      <div className="mt-[4px] text-[14px] leading-[1.5]">{children}</div>
    </div>
  );
}

export function Skeleton({ label = 'Loading content' }: { label?: string }) {
  return (
    <div role="status" className="space-y-[10px]" aria-label={label}>
      <div
        aria-hidden="true"
        className="h-[16px] w-2/3 animate-pulse rounded bg-muted/20"
      />
      <div
        aria-hidden="true"
        className="h-[12px] w-full animate-pulse rounded bg-muted/15"
      />
      <div
        aria-hidden="true"
        className="h-[12px] w-4/5 animate-pulse rounded bg-muted/15"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-[12px] border border-dashed border-subtleBorder bg-surface px-[24px] py-[32px] text-center">
      <h3 className="text-[18px] font-[600] text-content">{title}</h3>
      <p className="mx-auto mt-[8px] max-w-[48ch] text-[14px] text-muted">
        {description}
      </p>
      {action && <div className="mt-[20px] flex justify-center">{action}</div>}
    </section>
  );
}
