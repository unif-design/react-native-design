import {
  back,
  navigate,
  shouldConsumeHardwareBack,
  type NavigationState,
} from '../navigation/exampleNavigation';

test('navigate 从 Home 进入场景且重复导航保持二层 typed state', () => {
  expect(navigate(['home'], 'forms')).toEqual(['home', 'forms']);
  expect(navigate(['home', 'forms'], 'forms')).toEqual(['home', 'forms']);
  expect(navigate(['home', 'forms'], 'media')).toEqual(['home', 'media']);
});

test('back 从场景回 Home 且 Home 保持不变', () => {
  expect(back(['home', 'forms'])).toEqual(['home']);
  expect(back(['home'])).toEqual(['home']);
});

test('硬件返回与 Provider back 共用 child/home 判定', () => {
  const child: NavigationState = ['home', 'forms'];
  const home: NavigationState = ['home'];

  expect(shouldConsumeHardwareBack(child)).toBe(true);
  expect(shouldConsumeHardwareBack(home)).toBe(false);
});
