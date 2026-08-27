import { toneClasses } from './status';

describe('semantic status tones', () => {
  it('defines a non-colour border and text treatment for every tone', () => {
    expect(Object.keys(toneClasses)).toEqual([
      'neutral',
      'info',
      'success',
      'warning',
      'danger',
    ]);

    for (const classes of Object.values(toneClasses)) {
      expect(classes).toContain('border-');
      expect(classes).toContain('text-');
    }
  });
});
