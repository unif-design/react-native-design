import React from 'react';
import { StyleSheet } from 'react-native';
import {
  ActionMenuContent,
  ImagePreview,
  Sheet,
  SmsField,
  TextEntryContent,
  IconButton,
  type ActionMenuAction,
  type ImagePreviewHandle,
  type ImagePreviewItem,
} from '@unif/react-native-design';

const noop = () => {};
const styles = StyleSheet.create({ compactContent: { paddingTop: 0 } });
const actions: ActionMenuAction[] = [
  {
    id: 'delete',
    label: '删除',
    icon: 'trash',
    accessibilityHint: '先确认再移除原项',
    onPress: noop,
    confirmation: { message: '确认删除？', confirmLabel: '删除' },
  },
];
const items: readonly ImagePreviewItem[] = [
  { id: 'stable', source: { uri: 'https://example.com/image.png' } },
];
const preview = React.createRef<ImagePreviewHandle>();
<ImagePreview
  ref={preview}
  items={items}
  width={200}
  height={160}
  onRequestDelete={(item) => item.id}
/>;
preview.current?.scrollTo('stable', false);
<Sheet contentMode="external-scroll" footerStyle={styles.compactContent}>
  <ActionMenuContent
    actions={actions}
    onClose={noop}
    contentStyle={styles.compactContent}
  />
</Sheet>;
<TextEntryContent
  title="编辑"
  value="原文"
  onChangeText={noop}
  onSubmit={noop}
  onCancel={noop}
/>;
<TextEntryContent
  variant="compact"
  placeholder="请输入短标题"
  title="标题"
  value="原文"
  onChangeText={noop}
  onSubmit={noop}
  onCancel={noop}
/>;
<TextEntryContent
  // @ts-expect-error 通用展示不包含业务专用variant。
  variant="conversation"
  title="标题"
  value="原文"
  onChangeText={noop}
  onSubmit={noop}
  onCancel={noop}
/>;
<SmsField
  value=""
  onChangeText={noop}
  onSend={noop}
  sendLabel="发送"
  remainingSeconds={0}
  maxLength={4}
/>;
<IconButton
  icon="crosshair"
  surfaceSize={36}
  iconSize={22}
  accessibilityLabel="定位"
  onPress={noop}
/>;
// @ts-expect-error 稳定身份必填。
<ImagePreview items={[{ source: 1 }]} width={200} height={160} />;
// @ts-expect-error 编辑必须交付受控输入变化。
<TextEntryContent title="编辑" value="原文" onSubmit={noop} onCancel={noop} />;
// @ts-expect-error 发送文案由调用方提供。
<SmsField value="" onChangeText={noop} onSend={noop} remainingSeconds={0} />;
// @ts-expect-error 不增加第四种 Sheet 模式。
<Sheet contentMode="auto">内容</Sheet>;

<ActionMenuContent presentation="popover" actions={actions} onClose={noop} />;
