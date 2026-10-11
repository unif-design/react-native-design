import { HomeOutlined, InfoOutlined } from '@unif/react-native-icons';
import { CloseOutlined } from '@unif/react-native-icons';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import {
  Button,
  Chip,
  IconButton,
  Segmented,
  Switch,
  TabBar,
  Tabs,
  ThemeProvider,
} from '@unif/react-native-design';
import { Switch as WebSwitch } from '../../../src/components/ui/Switch/Switch.web';

// Inspect the control before native View consumes aria props; browsers are verified separately.
function controlProps(testID: string) {
  const host = screen.getByTestId(testID);
  let node = host;
  while (node) {
    if (
      node.props.testID === testID &&
      Object.keys(node.props).some((key) => key.startsWith('aria-'))
    )
      return node.props;
    if (!node.parent) break;
    node = node.parent;
  }
  return host.props;
}

const Theme = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

test('Button forwards one effective state to native and modern Web props', () => {
  const press = jest.fn();
  const view = render(
    <Button
      label="提交"
      variant="secondary"
      loading
      accessibilityState={{ selected: true, checked: 'mixed', expanded: true }}
      onPress={press}
      testID="action"
    />,
    { wrapper: Theme }
  );
  expect(controlProps('action')).toMatchObject({
    'role': 'button',
    'aria-disabled': true,
    'aria-busy': true,
    'aria-selected': true,
    'aria-checked': 'mixed',
    'aria-expanded': true,
    'accessibilityState': {
      disabled: true,
      busy: true,
      selected: true,
      checked: 'mixed',
      expanded: true,
    },
  });
  fireEvent.press(screen.getByTestId('action'));
  expect(press).not.toHaveBeenCalled();
  view.rerender(
    <Button label="提交" variant="secondary" onPress={press} testID="action" />
  );
  expect(controlProps('action')).toMatchObject({
    'aria-disabled': false,
    'aria-busy': false,
    'aria-selected': undefined,
    'aria-checked': undefined,
    'aria-expanded': undefined,
  });
  fireEvent.press(screen.getByTestId('action'));
  expect(press).toHaveBeenCalledTimes(1);
});

test('IconButton uses the same disabled Web boundary', () => {
  const press = jest.fn();
  render(
    <IconButton
      icon={CloseOutlined}
      accessibilityLabel="关闭"
      variant="secondary"
      disabled
      onPress={press}
      testID="icon-action"
    />,
    { wrapper: Theme }
  );
  expect(controlProps('icon-action')).toMatchObject({
    'role': 'button',
    'aria-disabled': true,
    'aria-busy': false,
    'accessibilityState': { disabled: true, busy: false },
  });
  fireEvent.press(screen.getByTestId('icon-action'));
  expect(press).not.toHaveBeenCalled();
});

test('Chip selected and busy state also reach Web without allowing a second action', () => {
  const press = jest.fn();
  const view = render(
    <Chip label="客户" selected busy onPress={press} testID="chip" />,
    { wrapper: Theme }
  );
  expect(controlProps('chip')).toMatchObject({
    'role': 'button',
    'aria-disabled': true,
    'aria-busy': true,
    'aria-selected': true,
    'accessibilityState': { disabled: true, busy: true, selected: true },
  });
  fireEvent.press(screen.getByTestId('chip'));
  expect(press).not.toHaveBeenCalled();
  view.rerender(<Chip label="客户" onPress={press} testID="chip" />);
  expect(controlProps('chip')).toMatchObject({
    'aria-disabled': false,
    'aria-busy': false,
    'aria-selected': false,
  });
});

test.each([
  { name: 'Tabs', Control: Tabs },
  { name: 'Segmented', Control: Segmented },
])('$name forwards tab selection and disablement', ({ Control }) => {
  const change = jest.fn();
  render(
    <Control
      value="a"
      onChange={change}
      items={[
        { id: 'a', label: '甲' },
        { id: 'b', label: '乙', disabled: true },
      ]}
      testID="choice"
    />,
    { wrapper: Theme }
  );
  expect(controlProps('choice').role).toBe('tablist');
  expect(controlProps('choice-a')).toMatchObject({
    'role': 'tab',
    'aria-selected': true,
    'aria-disabled': false,
    'tabIndex': 0,
  });
  expect(controlProps('choice-b')).toMatchObject({
    'role': 'tab',
    'aria-selected': false,
    'aria-disabled': true,
    'tabIndex': -1,
    'accessibilityState': { disabled: true, selected: false },
  });
  fireEvent.press(screen.getByTestId('choice-b'));
  expect(change).not.toHaveBeenCalled();
});

test('TabBar exposes the controlled selection on its Web tab', () => {
  const change = jest.fn();
  const items = [
    { id: 'home', label: '首页', icon: HomeOutlined },
    { id: 'info', label: '详情', icon: InfoOutlined },
  ];
  const view = render(
    <TabBar
      active="home"
      onChange={change}
      items={items}
      testID="navigation"
    />,
    { wrapper: Theme }
  );
  expect(controlProps('navigation').role).toBe('tablist');
  expect(controlProps('navigation-home')).toMatchObject({
    'role': 'tab',
    'aria-selected': true,
    'tabIndex': 0,
  });
  fireEvent.press(screen.getByTestId('navigation-info'));
  expect(change).toHaveBeenCalledWith('info');
  expect(controlProps('navigation-home')['aria-selected']).toBe(true);
  view.rerender(
    <TabBar active="info" onChange={change} items={items} testID="navigation" />
  );
  expect(controlProps('navigation-info')['aria-selected']).toBe(true);
  expect(controlProps('navigation-home')['aria-selected']).toBe(false);
});

test.each([
  { name: 'native', Control: Switch },
  { name: 'web', Control: WebSwitch },
])(
  '$name Switch sends checked and disabled state without changing its controlled value',
  ({ Control }) => {
    const change = jest.fn();
    const view = render(
      <Control
        value
        disabled
        onChange={change}
        accessibilityLabel="同步"
        testID="setting"
      />,
      { wrapper: Theme }
    );
    expect(controlProps('setting')).toMatchObject({
      'role': 'switch',
      'aria-checked': true,
      'aria-disabled': true,
      'tabIndex': -1,
      'accessibilityState': { checked: true, disabled: true },
    });
    fireEvent.press(screen.getByTestId('setting'));
    expect(change).not.toHaveBeenCalled();
    view.rerender(
      <Control
        value={false}
        onChange={change}
        accessibilityLabel="同步"
        testID="setting"
      />
    );
    expect(controlProps('setting')).toMatchObject({
      'aria-checked': false,
      'aria-disabled': false,
      'tabIndex': 0,
    });
    fireEvent.press(screen.getByTestId('setting'));
    expect(change).toHaveBeenCalledWith(true);
    expect(controlProps('setting')['aria-checked']).toBe(false);
  }
);
