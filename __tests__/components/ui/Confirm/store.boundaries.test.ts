import { describe, expect, jest, test } from '@jest/globals';
import { createConfirmStore } from '../../../../src/components/ui/Confirm/store';
import type { ConfirmEntry } from '../../../../src/components/ui/Confirm/store';

const log = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('reentrant failed subscribers', () => {
  test.each(['show', 'clear'] as const)(
    '%s callback replacing its owner before failing cannot revoke the successor',
    async (failurePhase) => {
      const store = createConfirmStore(log);
      let original!: ConfirmEntry;
      let replacement!: ConfirmEntry;
      let nextOutcome!: Promise<boolean>;
      store.registerHost((event) => {
        if (event.type === 'show') original = event.entry;
        if (event.type !== failurePhase) return;
        store.registerHost((next) => {
          if (next.type === 'show') replacement = next.entry;
        });
        nextOutcome = store.request({ title: 'replacement' });
        throw new Error('old subscriber failed');
      });
      const outcome = store.request({ title: 'original' });
      if (failurePhase === 'clear') store.settle(original, true);
      await expect(outcome).resolves.toBe(failurePhase === 'clear');
      expect(store.activeEntry()).toBe(replacement);
      expect(store.settle(replacement, true)).toBe(true);
      await expect(nextOutcome).resolves.toBe(true);
    }
  );

  test('a subscriber corrupting its entry cannot force owner replacement into an endless drain', async () => {
    const store = createConfirmStore(log);
    let held!: ConfirmEntry;
    store.registerHost((event) => {
      if (event.type === 'show') {
        held = event.entry;
        held.settled = true;
      }
    });
    const outcome = store.request({ title: 'corrupt state' });
    expect(() => store.registerHost(() => {})).not.toThrow();
    expect(store.activeEntry()).toBe(held);
    held.settled = false;
    store.settle(held, false);
    await expect(outcome).resolves.toBe(false);
  });

  test('invalid runtime subscriber cannot be restored from the suspended stack', async () => {
    const store = createConfirmStore(log);
    store.registerHost(undefined as never);
    const lease = store.registerHost(() => {});
    lease.release(null);
    await expect(store.request({ title: 'no live owner' })).resolves.toBe(
      false
    );
  });
});
