import { modeEmitter, subscribeToMode } from './mode.component';

describe('theme subscriptions', () => {
  it('removes only the listener returned by its own subscription', () => {
    const first = jest.fn();
    const second = jest.fn();
    const unsubscribeFirst = subscribeToMode(first);
    const unsubscribeSecond = subscribeToMode(second);

    unsubscribeFirst();
    modeEmitter.emit('mode', 'light');

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('light');

    unsubscribeSecond();
    expect(modeEmitter.listenerCount('mode')).toBe(0);
  });
});
