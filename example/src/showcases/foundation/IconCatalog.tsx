import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Empty,
  ICON_NAMES,
  Icon,
  Search,
  Segmented,
  type ColorTokens,
  childTestID,
  fontMono,
  radius,
  space,
  type,
  useColors,
  useThemedStyles,
} from '@unif/react-native-design';
import type { FoundationSceneState } from '../../state/showcaseState';
import { SectionCard } from '../../shared/SectionCard';

const ICON_BATCH_SIZE = 24;

type IconCatalogProps = Readonly<{
  draft: FoundationSceneState;
  updateDraft: (
    updater: (current: FoundationSceneState) => FoundationSceneState
  ) => void;
}>;

const iconSizeItems = [
  { id: '16', label: '16 点图标' },
  { id: '24', label: '24 点图标' },
  { id: '32', label: '32 点图标' },
];

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    controls: {
      gap: space['5'],
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space['5'],
    },
    item: {
      alignItems: 'center',
      backgroundColor: colors.surfaceContainer,
      borderRadius: radius.md,
      flexBasis: '29%',
      flexGrow: 1,
      gap: space['3'],
      minWidth: 92,
      padding: space['5'],
    },
    itemPrefix: {
      color: colors.foregroundMuted,
      fontSize: type.xxs,
    },
    itemName: {
      color: colors.foreground,
      fontFamily: fontMono,
      fontSize: type.xxs,
      textAlign: 'center',
    },
  });

export function IconCatalog({
  draft,
  updateDraft,
}: IconCatalogProps): React.JSX.Element {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const normalizedQuery = draft.iconQuery.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      ICON_NAMES.filter((name) => name.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery]
  );
  const visible = filtered.slice(0, draft.iconLoadedCount);

  return (
    <SectionCard
      title="图标目录"
      description={`按名称检索，当前匹配 ${filtered.length} 个图标。`}
    >
      <View style={styles.controls}>
        <Search
          value={draft.iconQuery}
          onChangeText={(iconQuery) =>
            updateDraft((current) => ({ ...current, iconQuery }))
          }
          placeholder="搜索图标名称"
          accessibilityLabel="搜索图标名称"
          testID="foundation-icon-search"
        />
        <Segmented
          value={String(draft.iconSize)}
          items={iconSizeItems}
          onChange={(value) => {
            const next = Number(value);
            if (next !== 16 && next !== 24 && next !== 32) return;
            updateDraft((current) => ({ ...current, iconSize: next }));
          }}
          testID="foundation-icon-size"
        />
      </View>
      {visible.length === 0 ? (
        <Empty
          title="没有匹配的图标"
          desc="请尝试更短的英文名称。"
          icon="search"
        />
      ) : (
        <View style={styles.grid}>
          {visible.map((name) => (
            <View
              key={name}
              style={styles.item}
              testID={childTestID('foundation-icons', name)}
            >
              <Icon name={name} size={draft.iconSize} color={colors.primary} />
              <Text style={styles.itemPrefix}>图标</Text>
              <Text style={styles.itemName}>{name}</Text>
            </View>
          ))}
        </View>
      )}
      {visible.length < filtered.length ? (
        <Button
          label="加载更多图标"
          variant="secondary"
          onPress={() =>
            updateDraft((current) => ({
              ...current,
              iconLoadedCount: current.iconLoadedCount + ICON_BATCH_SIZE,
            }))
          }
        />
      ) : null}
    </SectionCard>
  );
}
