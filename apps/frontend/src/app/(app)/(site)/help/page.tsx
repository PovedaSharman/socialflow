export const dynamic = 'force-dynamic';
import { HelpCentre } from '@gitroom/frontend/components/help/help.centre';
import { Metadata } from 'next';
import { isGeneralServerSide } from '@gitroom/helpers/utils/is.general.server.side';

export const metadata: Metadata = {
  title: `${isGeneralServerSide() ? 'SocialFlow' : 'Gitroom'} Help`,
  description:
    'Searchable help centre for scheduling, channels, MCP and billing.',
};

export default async function Page() {
  return (
    <div className="bg-newBgColorInner flex-1 flex-col flex p-[20px] gap-[12px]">
      <HelpCentre />
    </div>
  );
}
