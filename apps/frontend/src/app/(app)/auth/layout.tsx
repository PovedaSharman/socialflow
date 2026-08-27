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
      <div className="flex flex-1 flex-col rounded-[12px] border border-subtleBorder bg-surface p-[12px] px-[20px] py-[40px] text-content lg:w-[600px] lg:flex-none">
        <div className="mx-auto flex h-full w-full max-w-[440px] flex-col justify-center gap-[20px] text-content">
          <div className="flex items-center justify-between gap-[16px]">
            <LogoTextComponent />
            <ModeComponent />
          </div>
          <div className="flex">{children}</div>
        </div>
      </div>
      <div className="text-[36px] flex-1 pt-[88px] hidden lg:flex flex-col items-center">
        <div className="text-center">
          Plan, approve and publish with
          <br />
          <span style={{ color: brand.primary }}>{brand.name}</span>
        </div>
        <TestimonialComponent />
      </div>
    </div>
  );
}
