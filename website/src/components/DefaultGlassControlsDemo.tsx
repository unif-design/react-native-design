import { ChevronLeftOutlined, HomeOutlined } from '@unif/react-native-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Carousel,
  Chip,
  EntryCard,
  NavBar,
  Search,
  Sheet,
  Stepper,
  Switch,
  Tabs,
  VersionPill,
  useColors,
} from '@unif/react-native-design';

/** 展示公共控件的默认材质，调用方无需指定 tint 或深浅色。 */
export function DefaultGlassControlsDemo() {
  const colors = useColors();
  const [selected, setSelected] = useState(false);
  const [value, setValue] = useState(0);
  const [enabled, setEnabled] = useState(false);
  const [tab, setTab] = useState('overview');
  const [event, setEvent] = useState('等待操作');
  return (
    <div
      data-testid="default-glass-controls"
      style={{
        padding: 20,
        background: 'linear-gradient(160deg, #80b2b433, #bba0bc33, #b99c6b33)',
      }}
    >
      <View style={styles.column}>
        <NavBar
          title="项目导航"
          left={{
            icon: ChevronLeftOutlined,
            accessibilityLabel: '返回项目',
            onPress: () => setEvent('已返回'),
          }}
        />
        <Search
          defaultValue="客户"
          accessibilityLabel="搜索客户"
          onSubmit={(text) => setEvent(`搜索：${text}`)}
        />
        <View style={styles.row}>
          <Chip
            label="筛选客户"
            selected={selected}
            onPress={() => setSelected(!selected)}
          />
          <Chip
            label="忙碌标签"
            busy
            onPress={() => setEvent('忙碌项不应触发')}
          />
          <Chip
            label="禁用标签"
            disabled
            onPress={() => setEvent('禁用项不应触发')}
          />
        </View>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'overview', label: '概览' },
            { id: 'details', label: '详情' },
            { id: 'disabled', label: '禁用', disabled: true },
          ]}
        />
        <View style={styles.row}>
          <Stepper
            value={value}
            onChange={setValue}
            min={0}
            max={2}
            accessibilityLabel="数量"
          />
          <Switch
            value={enabled}
            onChange={setEnabled}
            accessibilityLabel="启用通知"
          />
          <Switch
            value
            disabled
            onChange={() => setEvent('禁用项不应触发')}
            accessibilityLabel="禁用通知"
          />
          <Button
            label="次要操作"
            variant="secondary"
            onPress={() => setEvent('操作已交付')}
          />
          <Button
            label="禁用次要操作"
            variant="secondary"
            disabled
            onPress={() => setEvent('禁用项不应触发')}
          />
        </View>
        <EntryCard
          icon={HomeOutlined}
          title="工作空间"
          sub="打开入口"
          onPress={() => setEvent('已打开入口')}
        />
        <View style={styles.row}>
          <VersionPill version="1.0.0" build="42" />
          <Carousel
            data={['#829d9e', '#9e829c', '#a19374']}
            itemSize={180}
            height={80}
            autoplay={false}
            indicatorPosition="overlay-bottom-right"
            renderItem={({ item }) => (
              <View style={[styles.slide, { backgroundColor: item }]}>
                <Text>预览内容</Text>
              </View>
            )}
          />
        </View>
        <View style={styles.sheet}>
          <Sheet
            footer={
              <Button
                label="保留选择"
                variant="secondary"
                onPress={() => setEvent('已保留选择')}
              />
            }
          >
            <Text style={{ color: colors.foreground }}>
              正文保持清晰，底部工具区使用系统材质。
            </Text>
          </Sheet>
        </View>
        <Text
          testID="default-glass-result"
          style={{ color: colors.foreground }}
        >
          {`${event} · 筛选:${selected} · 数量:${value} · 通知:${enabled} · 页面:${tab}`}
        </Text>
      </View>
    </div>
  );
}

const styles = StyleSheet.create({
  column: { gap: 20 },
  row: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sheet: { height: 180 },
});
