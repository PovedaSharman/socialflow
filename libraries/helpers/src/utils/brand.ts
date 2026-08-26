export type BrandConfig = {
  name: string;
  shortName: string;
  primary: string;
  supportUrl: string;
  sourceUrl: string;
  termsUrl: string;
  privacyUrl: string;
};

const cleanHexColour = (value: string | undefined) =>
  /^#[0-9a-f]{6}$/i.test(value || '') ? value! : '#4F46E5';

/** The single replaceable product-brand contract. */
export const brandConfig = (): BrandConfig => ({
  name: process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || 'SocialFlow',
  shortName:
    process.env.NEXT_PUBLIC_BRAND_SHORT_NAME?.trim() ||
    process.env.NEXT_PUBLIC_BRAND_NAME?.trim() ||
    'SocialFlow',
  primary: cleanHexColour(process.env.NEXT_PUBLIC_BRAND_PRIMARY),
  supportUrl: process.env.NEXT_PUBLIC_SUPPORT_URL?.trim() || '/help',
  sourceUrl: process.env.NEXT_PUBLIC_SOURCE_URL?.trim() || '',
  termsUrl: process.env.NEXT_PUBLIC_TERMS_URL?.trim() || '/legal/terms',
  privacyUrl: process.env.NEXT_PUBLIC_PRIVACY_URL?.trim() || '/legal/privacy',
});
