import React, { useState } from 'react';
import { Text, View } from 'react-native';
import {
  ActionMenuContent,
  Button,
  IconButton,
  Segmented,
  TabBar,
  TextEntryContent,
  ToastHost,
  toast,
  useColors,
} from '@unif/react-native-design';

/** 使用正式公共组件；外层 LiveDemo 负责主题、安全区和手势宿主。 */
export function LiquidGlassDemo() {
  const c = useColors();
  const [name, setName] = useState('门店拜访记录');
  const [tab, setTab] = useState('chat');
  const [event, setEvent] = useState('操作结果会显示在这里');
  return (
    <View style={{ gap: 24, alignItems: 'center', paddingVertical: 16 }}>
      <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
        <IconButton
          variant="glass"
          surfaceSize={36}
          iconSize={21}
          icon="chevron-left"
          accessibilityLabel="返回演示"
          onPress={() => setEvent('已返回')}
        />
        <Button
          variant="glass"
          label="显示提示"
          onPress={() => toast.info('内容已保存。可以继续编辑下一条记录。')}
        />
        <Button variant="glass" label="正在保存" loading onPress={() => {}} />
        <Button variant="glass" label="暂不可用" disabled onPress={() => {}} />
      </View>
      <View
        style={{
          flexDirection: 'row',
          gap: 24,
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignSelf: 'stretch',
        }}
      >
        <ActionMenuContent
          presentation="popover"
          title="聊天操作"
          pointer={{ edge: 'top', offset: 34 }}
          cancelLabel={null}
          actions={[
            {
              id: 'rename',
              label: '重命名',
              icon: 'edit',
              onPress: () => setEvent('编辑下方名称'),
            },
            {
              id: 'delete',
              label: '删除聊天',
              icon: 'trash',
              tone: 'danger',
              confirmation: {
                title: '删除聊天',
                message: '此操作无法撤销。',
                confirmLabel: '删除',
              },
              onPress: () => setEvent('已确认删除'),
            },
          ]}
          onClose={() => setEvent('已关闭菜单')}
        />
        <View style={{ width: 280, maxWidth: '100%' }}>
          <TextEntryContent
            variant="compact"
            title="重命名"
            value={name}
            onChangeText={setName}
            autoFocus={false}
            onSubmit={() => setEvent(`名称：${name}`)}
            onCancel={() => setEvent('已取消重命名')}
          />
        </View>
      </View>
      <Segmented
        surface="glass"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'chat', label: '聊天' },
          { id: 'visit', label: '拜访' },
          { id: 'disabled', label: '禁用', disabled: true },
        ]}
      />
      <View style={{ width: 300, maxWidth: '100%' }}>
        <TabBar
          surface="glass"
          active={tab}
          onChange={setTab}
          items={[
            { id: 'chat', label: '聊天', icon: 'chat-star' },
            { id: 'visit', label: '拜访', icon: 'calendar' },
          ]}
        />
      </View>
      <Text
        accessibilityLiveRegion="polite"
        style={{ color: c.foregroundMuted }}
      >
        {event}
      </Text>
      <ToastHost testID="glass-demo-toast" />
    </View>
  );
}
