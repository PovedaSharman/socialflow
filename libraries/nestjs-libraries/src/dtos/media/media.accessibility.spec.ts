import {
  MEDIA_ALT_MAX_LENGTH,
  mediaAccessibilityError,
} from './media.accessibility';

describe('media accessibility validation', () => {
  it('accepts trimmed alternative text', () => {
    expect(
      mediaAccessibilityError([{ image: [{ alt: ' A person at a desk ' }] }])
    ).toBe('');
  });

  it('rejects missing and whitespace-only alternative text', () => {
    expect(mediaAccessibilityError([{ image: [{}, { alt: '   ' }] }])).toBe(
      'Add alternative text for every image or video before scheduling.'
    );
  });

  it('bounds alternative text', () => {
    expect(
      mediaAccessibilityError([
        { image: [{ alt: 'x'.repeat(MEDIA_ALT_MAX_LENGTH + 1) }] },
      ])
    ).toBe('Alternative text must contain at most 1000 characters.');
  });
});
