import { getT } from '@gitroom/react/translation/get.translation.service.backend';

export const dynamic = 'force-dynamic';
import { ReactNode } from 'react';
import loadDynamic from 'next/dynamic';
import { TestimonialComponent } from '@gitroom/frontend/components/auth/testimonial.component';
import { LogoTextComponent } from '@gitroom/frontend/components/ui/logo-text.component';
import { brandConfig } from '@gitroom/helpers/utils/brand';
import ModeComponent from '@gitroom/frontend/components/layout/mode.component';
const ReturnUrlComponent = loadDynamic(() => import('./return.url.component'));
export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getT();
  const brand = brandConfig();

  return (
    <div className="flex min-h-screen w-screen flex-1 gap-[12px] bg-canvas p-[12px] text-content">
      {/*<style>{`html, body {overflow-x: hidden;}`}</style>*/}
      <ReturnUrlComponent />
      <div className="flex flex-1 flex-col rounded-[12px] border border-subtleBorder bg-surface p-[12px] px-[20px] py-[40px] text-content shadow-sm lg:w-[600px] lg:flex-none">
        <div className="mx-auto flex h-full w-full max-w-[440px] flex-col justify-center gap-[20px] text-content">
          <div className="flex items-center justify-between gap-[16px]">
            <LogoTextComponent />
            <ModeComponent />
          </div>
          <div className="flex">{children}</div>
        </div>
      </div>
      <div className="relative hidden flex-1 flex-col items-center overflow-hidden rounded-[12px] border border-subtleBorder bg-surface pt-[88px] text-[36px] lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            background:
              'radial-gradient(ellipse at 70% 20%, rgba(5, 150, 105, 0.14), transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(5, 150, 105, 0.08), transparent 50%), linear-gradient(180deg, #fbfcfb 0%, #f4f6f5 100%)',
          }}
        />
        <div className="relative z-[1] text-center text-content">
          Plan, approve and publish with
          <br />
          <span style={{ color: brand.primary }}>{brand.name}</span>
        </div>
        <div className="relative z-[1]">
          <TestimonialComponent />
        </div>
      </div>
    </div>
  );
}
