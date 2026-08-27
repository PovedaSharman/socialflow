import { isMenuPathActive } from './menu-item';

describe('menu path matching', () => {
  it('matches an exact route and its descendants', () => {
    expect(isMenuPathActive('/launches', '/launches')).toBe(true);
    expect(isMenuPathActive('/launches/calendar', '/launches')).toBe(true);
  });

  it('does not match similarly prefixed, action, or external routes', () => {
    expect(isMenuPathActive('/launches-old', '/launches')).toBe(false);
    expect(isMenuPathActive('/launches', '#')).toBe(false);
    expect(isMenuPathActive('/launches', 'https://example.com')).toBe(false);
  });
});
