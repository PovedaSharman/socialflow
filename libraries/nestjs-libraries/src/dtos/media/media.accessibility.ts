export const MEDIA_ALT_MAX_LENGTH = 1_000;

export type MediaAccessibilityValue = {
  image?: Array<{ alt?: unknown }>;
};

export function mediaAccessibilityError(
  values: MediaAccessibilityValue[] | undefined
) {
  for (const value of values || []) {
    for (const media of value.image || []) {
      const alt = typeof media.alt === 'string' ? media.alt.trim() : '';
      if (!alt) {
        return 'Add alternative text for every image or video before scheduling.';
      }
      if (alt.length > MEDIA_ALT_MAX_LENGTH) {
        return `Alternative text must contain at most ${MEDIA_ALT_MAX_LENGTH} characters.`;
      }
    }
  }
  return '';
}
