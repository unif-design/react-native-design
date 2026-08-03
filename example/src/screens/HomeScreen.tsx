import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  EntryCard,
  type IconName,
  type ColorTokens,
  space,
  type,
  useFontScale,
  usePrefersReducedMotion,
  useTheme,
  useThemedStyles,
} from '@unif/react-native-design';
import { componentCatalog, type SceneId } from '../catalog/componentCatalog';
import { ShowcaseScaffold } from '../shared/ShowcaseScaffold';
import { useShowcase } from '../state/useShowcase';

type HomeSceneEntry = Readonly<{
  id: SceneId;
  title: string;
  icon: IconName;
  primaryState: string;
}>;

const homeScenes: readonly HomeSceneEntry[] = [
  {
    id: 'foundation',
    title: '基础能力与图标',
    icon: 'settings',
    primaryState: '主题、字号、图标目录',
  },
  {
    id: 'actions',
    title: '操作与状态',
    icon: 'check',
    primaryState: '按钮、标签与状态',
  },
  {
    id: 'feedback',
    title: '反馈与浮层',
    icon: 'alert',
    primaryState: '空态、动效与全局反馈',
  },
  {
    id: 'forms',
    title: '表单与输入',
    icon: 'edit',
    primaryState: '输入、选择与校验',
  },
  {
    id: 'navigation',
    title: '导航组件',
    icon: 'home',
    primaryState: '顶部、分段与底栏',
  },
  {
    id: 'collections',
    title: '容器与集合',
    icon: 'grid',
    primaryState: '卡片、列表与轮播',
  },
  {
    id: 'media',
    title: '媒体展示',
    icon: 'image',
    primaryState: '头像、缩略图与 Logo',
  },
  {
    id: 'business',
    title: '业务复合组件',
    icon: 'building',
    primaryState: '背景、统计与版本',
  },
] as const;

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    intro: {
      color: colors.foregroundMuted,
      fontSize: type.sm,
    },
    facts: {
      color: colors.foreground,
      fontSize: type.sm,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space['5'],
    },
    entry: {
      flexBasis: '47%',
      flexGrow: 1,
    },
  });

export function HomeScreen(): React.JSX.Element {
  const {
    navigate,
    state: { lastInteractionByScene, themeMode },
  } = useShowcase();
  const { scheme } = useTheme();
  const fontScale = useFontScale();
  const reducedMotion = usePrefersReducedMotion();
  const styles = useThemedStyles(makeStyles);
  const modeLabel =
    themeMode === 'system'
      ? '跟随系统'
      : themeMode === 'dark'
        ? '深色'
        : '浅色';
  const schemeLabel = scheme === 'dark' ? '深色' : '浅色';

  return (
    <ShowcaseScaffold title="设计系统示例">
      <Text style={styles.intro}>
        选择场景，查看组件覆盖、主要状态与最近一次安全交互摘要。
      </Text>
      <Text style={styles.facts}>
        主题模式：{modeLabel}；当前主题：{schemeLabel}
      </Text>
      <Text style={styles.facts}>字号倍率：{fontScale}</Text>
      <Text style={styles.facts}>
        减少动态效果：{reducedMotion ? '是' : '否'}
      </Text>
      <View style={styles.grid}>
        {homeScenes.map((entry) => {
          const count = componentCatalog.filter(
            (component) => component.scene === entry.id
          ).length;
          const latest = lastInteractionByScene[entry.id];
          const summary = `${count} 个组件 · ${entry.primaryState} · 最近：${
            latest?.summary ?? '暂无交互'
          }`;
          return (
            <EntryCard
              key={entry.id}
              icon={entry.icon}
              title={entry.title}
              sub={summary}
              onPress={() => navigate(entry.id)}
              style={styles.entry}
              testID={`home-scene-${entry.id}`}
            />
          );
        })}
      </View>
    </ShowcaseScaffold>
  );
}
