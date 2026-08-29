import { mediaAlternativeTextDisclosure } from './media.alternative-text';

describe('media alternative text disclosure', () => {
  it('is silent when every selected channel transmits alternative text', () => {
    expect(
      mediaAlternativeTextDisclosure([
        { name: 'Bluesky', mediaAlternativeText: 'official-api' },
        { name: 'Mastodon', mediaAlternativeText: 'official-api' },
      ])
    ).toBe('');
  });

  it('names channels that do not transmit alternative text', () => {
    expect(
      mediaAlternativeTextDisclosure([
        { name: 'Bluesky', mediaAlternativeText: 'official-api' },
        { name: 'X' },
        { name: 'LinkedIn' },
        { name: 'X' },
      ])
    ).toBe(
      'Alternative text is kept in SocialFlow for accessibility. These selected channels do not yet send it through their official APIs: X, LinkedIn.'
    );
  });
});
