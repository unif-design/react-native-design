import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  DrawerHeader,
  NavBar,
  Segmented,
  TabBar,
  Tabs,
  type ColorTokens,
  space,
  type,
  useThemedStyles,
} from '@unif/react-native-design';
import { ShowcaseScaffold } from '../../shared/ShowcaseScaffold';
import { SectionCard } from '../../shared/SectionCard';
import { useShowcase } from '../../state/useShowcase';

const tabItems = [
  { id: 'overview', label: '概览' },
  { id: 'details', label: '详情' },
  { id: 'disabled', label: '禁用页签', disabled: true },
];
const globalDisabledTabs = [
  { id: 'first', label: '全局甲' },
  { id: 'second', label: '全局乙' },
];
const segmentItems = [
  { id: 'first', label: '第一段' },
  { id: 'second', label: '第二段' },
  { id: 'disabled', label: '禁用分段', disabled: true },
];
const compactSegmentItems = [
  { id: 'compact-first', label: '紧凑甲' },
  { id: 'compact-second', label: '紧凑乙' },
];
const disabledSegmentItems = [
  { id: 'locked-first', label: '锁定甲' },
  { id: 'locked-second', label: '锁定乙' },
];
const tabBarItems = [
  { id: 'home', icon: 'home' as const, label: '首页' },
  { id: 'messages', icon: 'mail' as const, label: '消息', badge: 3 },
  { id: 'tasks', icon: 'clipboard' as const, label: '任务', badge: '99+' },
];

const tabLabels: Readonly<Record<string, string>> = {
  overview: '概览',
  details: '详情',
};
const segmentLabels: Readonly<Record<string, string>> = {
  first: '第一段',
  second: '第二段',
};
const tabBarLabels: Readonly<Record<string, string>> = {
  home: '首页',
  messages: '消息',
  tasks: '任务',
};

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    stack: {
      gap: space['7'],
    },
    specimens: {
      gap: space['5'],
    },
    displaySlot: {
      color: colors.foregroundMuted,
      fontSize: type.xs,
    },
  });

export function NavigationScene(): React.JSX.Element {
  const { appendResult, back, state, updateScene } = useShowcase();
  const styles = useThemedStyles(makeStyles);
  const draft = state.scenes.navigation;
  const record = (component: string, action: string, summary: string) => {
    appendResult({ scene: 'navigation', component, action, summary });
  };

  return (
    <ShowcaseScaffold
      title="导航组件"
      scene="navigation"
      onBack={() => {
        back();
      }}
      testID="navigation-screen"
    >
      <View style={styles.stack}>
        <SectionCard
          title="顶部导航栏"
          description="以下均为嵌入式组件示例，不会改变示例应用路由。"
        >
          <View style={styles.specimens}>
            <NavBar
              title="默认导航"
              subtitle="左右都是具名操作"
              variant="default"
              left={{
                icon: 'arrow-left',
                accessibilityLabel: '演示返回动作',
                onPress: () => record('NavBar', '操作', '返回动作已触发'),
              }}
              right={{
                icon: 'more-h',
                accessibilityLabel: '演示更多动作',
                onPress: () => record('NavBar', '操作', '更多动作已触发'),
              }}
              testID="navigation-navbar-default"
            />
            <NavBar
              title="品牌导航"
              variant="brand"
              left={<Text style={styles.displaySlot}>展示槽</Text>}
              testID="navigation-navbar-brand"
            />
            <NavBar
              title="透明导航"
              variant="transparent"
              testID="navigation-navbar-transparent"
            />
          </View>
        </SectionCard>

        <SectionCard
          title="抽屉头"
          description="纯展示面板，不把姓名或头像区域变成按钮。"
        >
          <DrawerHeader
            name="王小明"
            subtitle="华东区 · 管理员"
            testID="navigation-drawer-header"
          />
        </SectionCard>

        <SectionCard title="页面页签">
          <View style={styles.specimens}>
            <Tabs
              value={draft.selectedTab}
              onChange={(selectedTab) => {
                if (!(selectedTab in tabLabels)) return;
                updateScene('navigation', (current) => ({
                  ...current,
                  selectedTab,
                }));
                record(
                  'Tabs',
                  '选择',
                  `已选择${tabLabels[selectedTab] ?? '页签'}`
                );
              }}
              items={tabItems}
              testID="navigation-tabs"
            />
            <Tabs
              value="first"
              onChange={() => record('Tabs', '选择', '整体禁用页签已触发')}
              items={globalDisabledTabs}
              disabled
              testID="navigation-tabs-global-disabled"
            />
          </View>
        </SectionCard>

        <SectionCard title="分段选择">
          <View style={styles.specimens}>
            <Segmented
              value={draft.selectedSegment}
              onChange={(selectedSegment) => {
                if (!(selectedSegment in segmentLabels)) return;
                updateScene('navigation', (current) => ({
                  ...current,
                  selectedSegment,
                }));
                record(
                  'Segmented',
                  '选择',
                  `已选择${segmentLabels[selectedSegment] ?? '分段'}`
                );
              }}
              items={segmentItems}
              size="md"
              testID="navigation-segmented-md"
            />
            <Segmented
              value="compact-first"
              onChange={() => {}}
              items={compactSegmentItems}
              size="sm"
              testID="navigation-segmented-sm"
            />
            <Segmented
              value="locked-first"
              onChange={() => record('Segmented', '选择', '整体禁用分段已触发')}
              items={disabledSegmentItems}
              disabled
              testID="navigation-segmented-disabled"
            />
          </View>
        </SectionCard>

        <SectionCard
          title="底部页签栏"
          description="数字与 99+ 徽标会进入读屏名称；选择只更新当前 specimen。"
        >
          <TabBar
            active={draft.selectedTabBarItem}
            onChange={(selectedTabBarItem) => {
              if (!(selectedTabBarItem in tabBarLabels)) return;
              updateScene('navigation', (current) => ({
                ...current,
                selectedTabBarItem,
              }));
              record(
                'TabBar',
                '选择',
                `已选择${tabBarLabels[selectedTabBarItem] ?? '页签'}`
              );
            }}
            items={tabBarItems}
            testID="navigation-tabbar"
          />
        </SectionCard>
      </View>
    </ShowcaseScaffold>
  );
}
