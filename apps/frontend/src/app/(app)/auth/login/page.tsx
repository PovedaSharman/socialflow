export const dynamic = 'force-dynamic';
import { Login } from '@gitroom/frontend/components/auth/login';
import { Metadata } from 'next';
import { brandConfig } from '@gitroom/helpers/utils/brand';

export function generateMetadata(): Metadata {
  const brand = brandConfig();
  return {
    title: `Sign in · ${brand.name}`,
    description: `Sign in to your ${brand.name} workspace.`,
  };
}

export default async function Auth() {
  return <Login />;
}
