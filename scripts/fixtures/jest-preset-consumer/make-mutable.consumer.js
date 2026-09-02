'use strict';
/* global expect, test */

test('makeMutable 返回 RNGH 3 cleanup 可用的 shared value', () => {
  const { makeMutable } = require('react-native-reanimated');
  const eventMap = new Map([['handler', true]]);
  const mutableEventMap = makeMutable(eventMap);

  expect(mutableEventMap.value).toBe(eventMap);
  expect(() => mutableEventMap.value.delete('handler')).not.toThrow();
  expect(eventMap.size).toBe(0);
});
