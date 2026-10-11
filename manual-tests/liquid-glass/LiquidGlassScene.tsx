import {
  ChatPlusOutlined,
  ChatStarOutlined,
  ChevronLeftOutlined,
  EditOutlined,
  HomeOutlined,
  PlusOutlined,
  ShareOutlined,
  TrashOutlined,
  UserOutlined,
} from '@unif/react-native-icons';
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
  Carousel,
  Chip,
  ConfirmHost,
  EntryCard,
  IconButton,
  ImagePreview,
  NavBar,
  Search,
  Segmented,
  Sheet,
  Stepper,
  Switch,
  TabBar,
  Tabs,
  TextEntryContent,
  ThemeProvider,
  ToastHost,
  VersionPill,
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
  const [selected, setSelected] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let current = true;
    AccessibilityInfo.isReduceTransparencyEnabled().then((preference) => {
      if (current) setReduced(preference);
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
        {scene === 'controls' ? (
          <View style={styles.controls}>
            <Search
              defaultValue="客户"
              accessibilityLabel="搜索客户"
              testID="glass-search"
              onSubmit={(text) => setResult(`搜索：${text}`)}
            />
            <View style={styles.buttons}>
              <Chip
                label="筛选客户"
                selected={selected}
                onPress={() => setSelected(!selected)}
              />
              <Chip
                label="忙碌标签"
                busy
                onPress={() => setPresses((count) => count + 1)}
              />
              <Chip
                label="禁用标签"
                disabled
                onPress={() => setPresses((count) => count + 1)}
              />
            </View>
            <View style={styles.buttons}>
              <Chip
                label="带操作标签"
                disabled
                onPress={() => setPresses((count) => count + 1)}
                trailing={
                  <IconButton
                    icon={PlusOutlined}
                    variant="secondary"
                    size="sm"
                    disabled
                    accessibilityLabel="标签附加操作"
                    onPress={() => setPresses((count) => count + 1)}
                  />
                }
              />
            </View>
            <View style={styles.buttons}>
              <Stepper
                value={quantity}
                min={0}
                max={2}
                onChange={setQuantity}
                accessibilityLabel="数量"
                testID="glass-stepper"
              />
              <Switch
                value={enabled}
                onChange={setEnabled}
                accessibilityLabel="启用通知"
                testID="glass-switch"
              />
              <Switch
                value={true}
                disabled
                onChange={() => setPresses((count) => count + 1)}
                accessibilityLabel="禁用通知"
              />
            </View>
            <View style={styles.buttons}>
              <Button
                label="次要操作"
                variant="secondary"
                onPress={() => setPresses((count) => count + 1)}
              />
              <Button
                label="禁用次要操作"
                variant="secondary"
                disabled
                onPress={() => setPresses((count) => count + 1)}
              />
            </View>
          </View>
        ) : scene === 'navigation' ? (
          <View style={styles.controls}>
            <NavBar
              title="项目导航"
              left={{
                icon: ChevronLeftOutlined,
                accessibilityLabel: '返回项目',
                onPress: () => setPresses((count) => count + 1),
              }}
            />
            <Tabs
              value={tab}
              onChange={setTab}
              testID="glass-page-tabs"
              items={[
                { id: 'chat', label: '概览' },
                { id: 'history', label: '详情' },
                { id: 'disabled', label: '禁用', disabled: true },
              ]}
            />
            <EntryCard
              icon={HomeOutlined}
              title="工作空间"
              testID="glass-entry"
              sub="打开入口"
              onPress={() => setPresses((count) => count + 1)}
            />
            <VersionPill version="1.0.0" build="42" />
            <Carousel
              testID="glass-carousel"
              data={['#7C969E', '#967E95', '#A59470']}
              renderItem={({ item }) => (
                <View style={[styles.carouselItem, { backgroundColor: item }]}>
                  <Text>预览内容</Text>
                </View>
              )}
              height={110}
              itemSize={width * 0.9 - 24}
              indicatorPosition="overlay-bottom-right"
              autoplay={false}
              getAccessibilityLabel={(_item, index) => `预览第${index + 1}页`}
              onPressItem={(_item, index) => setResult(`轮播：${index + 1}`)}
            />
          </View>
        ) : scene === 'sheet' ? (
          <View style={styles.sheetHost}>
            <Sheet
              header={<NavBar title="选择项目" />}
              footer={
                <Button
                  label="保留选择"
                  variant="secondary"
                  onPress={() => setPresses((count) => count + 1)}
                />
              }
            >
              <Text style={{ color: colors.foreground }}>
                正文使用清晰的内容表面，顶部与底部工具区跟随系统材质。
              </Text>
            </Sheet>
          </View>
        ) : scene.startsWith('menu') ? (
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
                icon: EditOutlined,
                onPress: () => setResult('动作：重命名'),
              },
              {
                id: 'share',
                label: '分享聊天',
                icon: ShareOutlined,
                onPress: () => setResult('动作：分享'),
              },
              {
                id: 'delete',
                label: '删除聊天',
                icon: TrashOutlined,
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
                icon={PlusOutlined}
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
                { id: 'chat', icon: ChatPlusOutlined, label: '聊天' },
                { id: 'history', icon: ChatStarOutlined, label: '历史' },
                { id: 'profile', icon: UserOutlined, label: '我的' },
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
                icon={PlusOutlined}
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
        {`${result} · 点击:${presses} · 选项:${segment} · 导航:${tab} · 筛选:${selected} · 数量:${quantity} · 通知:${enabled}`}
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
  controls: { width: '90%', gap: 24 },
  carouselItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sheetHost: { width: '90%', height: 350 },
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
