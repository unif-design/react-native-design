import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Settings,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { isLiquidGlassSupported } from '@callstack/liquid-glass';
import {
  ActionMenuContent,
  Button,
  ConfirmHost,
  IconButton,
  ImagePreview,
  Segmented,
  TabBar,
  TextEntryContent,
  ThemeProvider,
  ToastHost,
  confirm,
  toast,
  useColors,
  useTheme,
} from '@unif/react-native-design';

const image = {
  uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
};

/** Native-only manual scene. Launch defaults choose content, never library state. */
export function LiquidGlassScene() {
  const scheme = Settings.get('glassScheme') === 'dark' ? 'dark' : 'light';
  return (
    <GestureHandlerRootView style={styles.fill}>
      <SafeAreaProvider>
        <ThemeProvider forceScheme={scheme}>
          <Scene />
          <ToastHost />
          <ConfirmHost />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Scene() {
  const scene = String(Settings.get('glassScene') ?? 'overview');
  const colors = useColors();
  const { scheme } = useTheme();
  const { width } = useWindowDimensions();
  const [reduced, setReduced] = useState<boolean>();
  const [result, setResult] = useState('等待操作');
  const [value, setValue] = useState('日常对话');
  const [segment, setSegment] = useState('all');
  const [tab, setTab] = useState('chat');
  const [presses, setPresses] = useState(0);

  useEffect(() => {
    let current = true;
    AccessibilityInfo.isReduceTransparencyEnabled().then((enabled) => {
      if (current) setReduced(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduced
    );
    const timer = setTimeout(() => {
      if (scene === 'toast') {
        toast({
          message: '已保存本次修改',
          kind: 'success',
          position: 'center',
          duration: 60000,
        });
      }
      if (scene === 'confirm') {
        confirm({
          title: '删除附件？',
          message: '此操作无法撤销。',
          confirmLabel: '删除',
          destructive: true,
        }).then((accepted) => setResult(accepted ? '已删除' : '已取消'));
      }
    }, 400);
    return () => {
      current = false;
      clearTimeout(timer);
      subscription.remove();
    };
  }, [scene]);

  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]}>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Liquid Glass 原生验证
        </Text>
        <Text
          testID="glass-status"
          style={[styles.caption, { color: colors.foregroundMuted }]}
        >
          {`${scene} · ${scheme} · 支持:${isLiquidGlassSupported} · 减少透明度:${reduced ?? '?'}`}
        </Text>
      </View>
      <View style={styles.stage}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {['#FC9654', '#92CBCD', '#9999D9', '#D9B475', '#73A6BB'].map(
            (color, index) => (
              <View
                key={color}
                style={[
                  styles.band,
                  { backgroundColor: color },
                  scheme === 'dark' ? styles.darkBand : styles.lightBand,
                ]}
              >
                <Text
                  style={styles.backdropLabel}
                >{`内容层 ${index + 1}`}</Text>
              </View>
            )
          )}
        </View>
        {scene.startsWith('menu') ? (
          <ActionMenuContent
            presentation="popover"
            cancelLabel={null}
            pointer={{
              edge: scene === 'menu-bottom' ? 'bottom' : 'top',
              offset: 42,
            }}
            testID="glass-menu"
            actions={[
              {
                id: 'rename',
                label: '重命名',
                icon: 'edit',
                onPress: () => setResult('动作：重命名'),
              },
              {
                id: 'share',
                label: '分享聊天',
                icon: 'share',
                onPress: () => setResult('动作：分享'),
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
                onPress: () => setResult('动作：删除'),
              },
            ]}
            onClose={() => setResult('菜单已关闭')}
          />
        ) : scene === 'text' ? (
          <TextEntryContent
            variant="compact"
            title="重命名聊天"
            value={value}
            onChangeText={setValue}
            onSubmit={(text) => setResult(`采用：${text}`)}
            onCancel={() => setResult('编辑已取消')}
            autoFocus={false}
            style={styles.textEntry}
          />
        ) : scene === 'image' ? (
          <ImagePreview
            width={width - 48}
            height={420}
            items={[
              { id: 'first', source: image, label: '第一张测试图' },
              { id: 'second', source: image, label: '第二张测试图' },
            ]}
            onCurrentChange={(item) => setResult(`当前图片：${item.id}`)}
          />
        ) : (
          <View style={styles.overview}>
            <View style={styles.buttons}>
              <Button
                label="玻璃按钮"
                variant="glass"
                onPress={() => setPresses((count) => count + 1)}
              />
              <IconButton
                icon="plus"
                variant="glass"
                accessibilityLabel="玻璃图标按钮"
                onPress={() => setPresses((count) => count + 1)}
              />
            </View>
            <View style={styles.segmentHost}>
              <Segmented
                testID="glass-segments"
                surface="glass"
                value={segment}
                onChange={setSegment}
                items={[
                  { id: 'all', label: '全部' },
                  { id: 'active', label: '进行中' },
                  { id: 'done', label: '已结束' },
                ]}
              />
            </View>
            <TabBar
              testID="glass-tabs"
              surface="glass"
              active={tab}
              onChange={setTab}
              items={[
                { id: 'chat', icon: 'chat-plus', label: '聊天' },
                { id: 'history', icon: 'chat-star', label: '历史' },
                { id: 'profile', icon: 'user', label: '我的' },
              ]}
            />
            <View style={styles.unavailableButtons}>
              <Button
                label="禁用玻璃按钮"
                variant="glass"
                disabled
                onPress={() => setPresses((count) => count + 1)}
              />
              <IconButton
                icon="plus"
                variant="glass"
                loading
                accessibilityLabel="忙碌玻璃图标"
                onPress={() => setPresses((count) => count + 1)}
              />
            </View>
          </View>
        )}
      </View>
      <Text
        testID="glass-result"
        style={[styles.result, { color: colors.foreground }]}
      >
        {`${result} · 点击:${presses} · 选项:${segment} · 导航:${tab}`}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  heading: { padding: 20, gap: 8 },
  title: { fontSize: 22, fontWeight: '600' },
  caption: { fontSize: 12 },
  stage: {
    flex: 1,
    marginHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  band: { flex: 1, justifyContent: 'center', paddingHorizontal: 14 },
  darkBand: { opacity: 0.3 },
  lightBand: { opacity: 0.58 },
  backdropLabel: { fontSize: 24, color: '#1C2330', fontWeight: '600' },
  overview: { width: '90%', gap: 34 },
  segmentHost: { alignSelf: 'center' },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  unavailableButtons: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  textEntry: { width: '90%' },
  result: { fontSize: 12, padding: 20 },
});
