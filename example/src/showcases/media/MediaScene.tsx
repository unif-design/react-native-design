import React, { useState } from 'react';
import { StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';
import {
  Avatar,
  Button,
  Empty,
  Input,
  Logo,
  Segmented,
  Switch,
  Thumbnail,
  type AvatarSize,
  type AvatarVariant,
  type ColorTokens,
  type ThumbnailSize,
  space,
  type,
  useThemedStyles,
} from '@unif/react-native-design';
import { ShowcaseScaffold } from '../../shared/ShowcaseScaffold';
import { SectionCard } from '../../shared/SectionCard';
import { useShowcase } from '../../state/useShowcase';

const DEFAULT_REMOTE_URI = 'https://images.example.com/unif-avatar.png';
const LOCAL_IMAGE: ImageSourcePropType = require('../../../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png');
const avatarSizes: readonly AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const avatarVariants: readonly AvatarVariant[] = [
  'brand',
  'info',
  'soft',
  'neutral',
];
const thumbnailSizes: readonly ThumbnailSize[] = ['sm', 'md', 'lg'];
const avatarSizeLabels: Readonly<Record<AvatarSize, string>> = {
  xs: '微型头像',
  sm: '小头像',
  md: '中头像',
  lg: '大头像',
  xl: '超大头像',
};
const avatarVariantLabels: Readonly<Record<AvatarVariant, string>> = {
  brand: '品牌',
  info: '信息',
  soft: '柔和',
  neutral: '中性',
};

const makeStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    stack: {
      gap: space['7'],
    },
    row: {
      alignItems: 'center',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space['5'],
    },
    controls: {
      gap: space['5'],
    },
    fact: {
      color: colors.foregroundMuted,
      fontSize: type.sm,
    },
  });

function isHttpsUri(value: string): boolean {
  const normalized = value.trim();
  return (
    normalized.length > 'https://'.length &&
    /^https:\/\/[^\s]+$/u.test(normalized)
  );
}

function isAvatarSize(value: string): value is AvatarSize {
  return avatarSizes.some((size) => size === value);
}

function isAvatarVariant(value: string): value is AvatarVariant {
  return avatarVariants.some((variant) => variant === value);
}

function isThumbnailSize(value: string): value is ThumbnailSize {
  return thumbnailSizes.some((size) => size === value);
}

export function MediaScene(): React.JSX.Element {
  const { appendResult, back, state, updateScene } = useShowcase();
  const draft = state.scenes.media;
  const [uriInput, setUriInput] = useState(draft.remoteUri);
  const styles = useThemedStyles(makeStyles);
  const record = (component: string, action: string, summary: string) => {
    appendResult({ scene: 'media', component, action, summary });
  };

  return (
    <ShowcaseScaffold
      title="媒体与身份"
      scene="media"
      onBack={() => {
        back();
      }}
      onReset={() => {
        setUriInput(DEFAULT_REMOTE_URI);
      }}
      testID="media-screen"
    >
      <View style={styles.stack}>
        <SectionCard
          title="Avatar 配置器"
          description="远程来源只持久化通过 HTTPS 校验的地址，结果面板不会记录原文。"
        >
          <View style={styles.controls}>
            <Segmented
              value={draft.avatarSize}
              items={avatarSizes.map((size) => ({
                id: size,
                label: avatarSizeLabels[size],
              }))}
              onChange={(value) => {
                if (!isAvatarSize(value)) return;
                updateScene('media', (current) => ({
                  ...current,
                  avatarSize: value,
                }));
              }}
            />
            <Segmented
              value={draft.avatarVariant}
              items={avatarVariants.map((variant) => ({
                id: variant,
                label: avatarVariantLabels[variant],
              }))}
              onChange={(value) => {
                if (!isAvatarVariant(value)) return;
                updateScene('media', (current) => ({
                  ...current,
                  avatarVariant: value,
                }));
              }}
            />
            <Avatar
              label="配"
              size={draft.avatarSize}
              variant={draft.avatarVariant}
            />
            <Input
              value={uriInput}
              onChangeText={setUriInput}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              accessibilityLabel="远程头像地址"
              testID="media-remote-uri-input"
            />
            <Button
              label="应用远程头像地址"
              variant="secondary"
              onPress={() => {
                const normalized = uriInput.trim();
                if (!isHttpsUri(normalized)) {
                  record('Avatar', '更新来源', '地址未通过 HTTPS 校验');
                  return;
                }
                updateScene('media', (current) => ({
                  ...current,
                  remoteUri: normalized,
                }));
                record('Avatar', '更新来源', '已切换远程头像');
              }}
            />
          </View>
        </SectionCard>

        <SectionCard
          title="Avatar 尺寸与配色"
          description="图片来源失败时由 Avatar 自身回退到同一名称。"
        >
          <View style={styles.row}>
            {avatarSizes.map((size) => (
              <Avatar
                key={size}
                label="尺"
                size={size}
                variant="neutral"
                testID={`media-avatar-size-${size}`}
              />
            ))}
          </View>
          <View style={styles.row}>
            {avatarVariants.map((variant) => (
              <Avatar
                key={variant}
                label={
                  variant === 'brand'
                    ? '品'
                    : variant === 'info'
                      ? '信'
                      : variant === 'soft'
                        ? '柔'
                        : '中'
                }
                variant={variant}
                testID={`media-avatar-variant-${variant}`}
              />
            ))}
          </View>
          <View style={styles.row}>
            <Avatar
              label="本地头像"
              source={LOCAL_IMAGE}
              variant="brand"
              testID="media-avatar-local"
            />
            <Avatar
              label="远程头像"
              source={{ uri: draft.remoteUri }}
              variant="info"
              testID="media-avatar-remote"
            />
            <Avatar
              label="失效头像"
              source={{ uri: ' ' }}
              variant="soft"
              testID="media-avatar-invalid"
            />
          </View>
        </SectionCard>

        <SectionCard
          title="Thumbnail"
          description="加载失败只移除图片尝试，固定视觉框与选中环仍会保留。"
        >
          <Segmented
            value={draft.thumbnailSize}
            items={thumbnailSizes.map((size) => ({
              id: size,
              label:
                size === 'sm'
                  ? '小缩略图'
                  : size === 'md'
                    ? '中缩略图'
                    : '大缩略图',
            }))}
            onChange={(value) => {
              if (!isThumbnailSize(value)) return;
              updateScene('media', (current) => ({
                ...current,
                thumbnailSize: value,
              }));
            }}
          />
          <Switch
            value={draft.thumbnailSelected}
            onChange={(thumbnailSelected) =>
              updateScene('media', (current) => ({
                ...current,
                thumbnailSelected,
              }))
            }
            accessibilityLabel="缩略图选中视觉"
          />
          <Thumbnail
            uri={draft.remoteUri}
            size={draft.thumbnailSize}
            selected={draft.thumbnailSelected}
            accessibilityLabel="配置缩略图"
          />
          <View style={styles.row}>
            <Thumbnail
              uri={draft.remoteUri}
              size="sm"
              accessibilityLabel="远程缩略图"
              testID="media-thumbnail-uri-sm"
            />
            <Thumbnail
              source={LOCAL_IMAGE}
              size="md"
              selected
              accessibilityLabel="本地缩略图"
              testID="media-thumbnail-source-md"
            />
            <Thumbnail
              source={LOCAL_IMAGE}
              size="lg"
              testID="media-thumbnail-source-lg"
            />
          </View>
          <Text style={styles.fact}>失败后保留固定缩略图框</Text>
          <Empty
            title="消费方请求失败空态"
            desc="这是业务边界示例，不是 Thumbnail 内置返回值。"
            icon="image"
          />
        </SectionCard>

        <SectionCard
          title="Logo"
          description="Logo 没有网络失败回退，本示例只使用稳定本地图片。"
        >
          <Segmented
            value={String(draft.logoSize)}
            items={[
              { id: '48', label: '小标志' },
              { id: '64', label: '中标志' },
              { id: '88', label: '大标志' },
            ]}
            onChange={(value) => {
              const logoSize = value === '48' ? 48 : value === '64' ? 64 : 88;
              updateScene('media', (current) => ({
                ...current,
                logoSize,
              }));
            }}
          />
          <Logo
            source={LOCAL_IMAGE}
            size={draft.logoSize}
            accessibilityLabel="配置标志"
          />
          <View style={styles.row}>
            <Logo
              source={LOCAL_IMAGE}
              size={72}
              borderRadius={18}
              accessibilityLabel="Unif 示例标志"
              testID="media-logo-named"
            />
            <Logo
              source={LOCAL_IMAGE}
              size={48}
              testID="media-logo-decorative"
            />
          </View>
        </SectionCard>
      </View>
    </ShowcaseScaffold>
  );
}
