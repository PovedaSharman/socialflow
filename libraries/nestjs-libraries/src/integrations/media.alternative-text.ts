export type MediaAlternativeTextCapability = 'official-api';

export type MediaAlternativeTextProvider = {
  name: string;
  mediaAlternativeText?: MediaAlternativeTextCapability;
};

export function mediaAlternativeTextDisclosure(
  providers: MediaAlternativeTextProvider[] | undefined
) {
  const unsupported = [
    ...new Set(
      (providers || [])
        .filter((provider) => provider.mediaAlternativeText !== 'official-api')
        .map((provider) => provider.name.trim())
        .filter(Boolean)
    ),
  ];

  if (!unsupported.length) {
    return '';
  }

  return (
    'Alternative text is kept in SocialFlow for accessibility. These selected ' +
    `channels do not yet send it through their official APIs: ${unsupported.join(
      ', '
    )}.`
  );
}
