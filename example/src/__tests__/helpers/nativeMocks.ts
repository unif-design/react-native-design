import { BackHandler, Platform } from 'react-native';
import type { BackPressEventName, HardwareBackPressEvent } from 'react-native';

const originalPlatformOS = Platform.OS;
type ReanimatedMotionMock = {
  useReducedMotion?: () => boolean;
};

export type AndroidBackHandlerMock = Readonly<{
  addEventListener: jest.SpiedFunction<typeof BackHandler.addEventListener>;
  remove: jest.Mock<void, []>;
  getHandler: () => () => boolean;
}>;

export function installAndroidBackHandlerMock(): AndroidBackHandlerMock {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'android',
  });
  const remove = jest.fn<void, []>();
  let handler: (() => boolean) | undefined;
  const addEventListener = jest
    .spyOn(BackHandler, 'addEventListener')
    .mockImplementation(
      (
        _eventName: BackPressEventName,
        nextHandler: (
          event: HardwareBackPressEvent
        ) => boolean | null | undefined
      ) => {
        handler = () =>
          nextHandler({
            type: 'hardwareBackPress',
            timeStamp: 0,
          }) === true;
        return { remove };
      }
    );

  return {
    addEventListener,
    remove,
    getHandler() {
      if (!handler) throw new Error('BackHandler 尚未订阅');
      return handler;
    },
  };
}

export function installNonAndroidBackHandlerMock(): jest.SpiedFunction<
  typeof BackHandler.addEventListener
> {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'ios',
  });
  return jest.spyOn(BackHandler, 'addEventListener');
}

export function installReducedMotionMock(value: boolean): void {
  const reanimated = jest.requireActual<ReanimatedMotionMock>(
    'react-native-reanimated'
  );
  reanimated.useReducedMotion = jest.fn(() => value);
}

export function restoreNativeMocks(): void {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: originalPlatformOS,
  });
  const reanimated = jest.requireActual<ReanimatedMotionMock>(
    'react-native-reanimated'
  );
  delete reanimated.useReducedMotion;
}
