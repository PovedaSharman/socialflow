import {
  initialPageVisibility,
  subscribePageVisibility,
} from './use.is.visible';

class VisibilityDocumentTarget extends EventTarget {
  hidden = false;
}

describe('page visibility helpers', () => {
  it('defaults to visible during server rendering', () => {
    expect(initialPageVisibility()).toBe(true);
  });

  it('tracks visibility and removes every listener on cleanup', () => {
    const documentTarget = new VisibilityDocumentTarget();
    const windowTarget = new EventTarget();
    const changes: boolean[] = [];
    const cleanup = subscribePageVisibility(
      1,
      (visible) => changes.push(visible),
      documentTarget,
      windowTarget
    );

    documentTarget.hidden = true;
    documentTarget.dispatchEvent(new Event('visibilitychange'));
    windowTarget.dispatchEvent(new Event('focus'));
    expect(changes).toEqual([false, true]);

    cleanup();
    windowTarget.dispatchEvent(new Event('blur'));
    expect(changes).toEqual([false, true]);
  });

  it('does not subscribe on later pages', () => {
    const changes: boolean[] = [];
    const windowTarget = new EventTarget();
    subscribePageVisibility(
      2,
      (visible) => changes.push(visible),
      new VisibilityDocumentTarget(),
      windowTarget
    );

    windowTarget.dispatchEvent(new Event('blur'));
    expect(changes).toEqual([]);
  });
});
