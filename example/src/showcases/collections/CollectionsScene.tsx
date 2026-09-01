import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Card,
  Carousel,
  Cell,
  Empty,
  EntryCard,
  Grid,
  List,
  Ribbon,
  Segmented,
  Switch,
  type CarouselRef,
  type ColorTokens,
  type GridItem,
  space,
  type,
  usePrefersReducedMotion,
  useThemedStyles,
} from '@unif/react-native-design';
import { ShowcaseScaffold } from '../../shared/ShowcaseScaffold';
import { SectionCard } from '../../shared/SectionCard';
import { useShowcase } from '../../state/useShowcase';

type CarouselItem = Readonly<{ id: string; title: string }>;

const staticGridItems: GridItem[] = [
  { id: 'home', icon: 'home', label: '首页' },
  { id: 'settings', icon: 'settings', label: '设置' },
];
const actionGridItems: GridItem[] = [
  { id: 'message', icon: 'mail', label: '消息', badge: 0 },
  { id: 'task', icon: 'clipboard', label: '任务', badge: '99+' },
  { id: 'profile', icon: 'user', label: '个人' },
  { id: 'image', icon: 'image', label: '图片' },
];
const sixColumnGridItems: GridItem[] = [
  { id: 'home', icon: 'home', label: '首页' },
  { id: 'message', icon: 'mail', label: '消息' },
  { id: 'task', icon: 'clipboard', label: '任务' },
  { id: 'profile', icon: 'user', label: '个人' },
  { id: 'image', icon: 'image', label: '图片' },
  { id: 'settings', icon: 'settings', label: '设置' },
];
const oneCarouselItem: CarouselItem[] = [{ id: 'one', title: '单页展示' }];
const displayCarouselItems: CarouselItem[] = [
  { id: 'display-a', title: '纯展示甲' },
  { id: 'display-b', title: '纯展示乙' },
  { id: 'display-c', title: '纯展示丙' },
];
const actionCarouselItems: CarouselItem[] = [
  { id: 'action-a', title: '可操作甲' },
  { id: 'action-b', title: '可操作乙' },
  { id: 'action-c', title: '可操作丙' },
];

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
    specimenStack: {
      gap: space['5'],
    },
    ribbonStack: {
      gap: space['5'],
    },
    cardText: {
      color: colors.foreground,
      fontSize: type.sm,
    },
    fillFrame: {
      height: 104,
    },
    carouselSlide: {
      alignItems: 'center',
      backgroundColor: colors.surfaceContainer,
      flex: 1,
      justifyContent: 'center',
    },
    carouselText: {
      color: colors.foreground,
      fontSize: type.body,
    },
    fact: {
      color: colors.foregroundMuted,
      fontSize: type.sm,
    },
  });

export function CollectionsScene(): React.JSX.Element {
  const { appendResult, back, state, updateScene } = useShowcase();
  const styles = useThemedStyles(makeStyles);
  const reducedMotion = usePrefersReducedMotion();
  const draft = state.scenes.collections;
  const carouselRef = useRef<CarouselRef>(null);
  const record = (component: string, action: string, summary: string) => {
    appendResult({ scene: 'collections', component, action, summary });
  };
  const renderCarouselItem = ({ item }: { item: CarouselItem }) => (
    <View style={styles.carouselSlide}>
      <Text style={styles.carouselText}>{item.title}</Text>
    </View>
  );
  const setCarouselEnabled = (carouselEnabled: boolean) => {
    updateScene('collections', (current) => ({
      ...current,
      carouselEnabled,
    }));
  };

  return (
    <ShowcaseScaffold
      title="容器与集合"
      scene="collections"
      onBack={() => {
        back();
      }}
      testID="collections-screen"
    >
      <View style={styles.stack}>
        <SectionCard
          title="Card 配置与状态"
          description="变体、裸壳和撑满配置会在离开场景后保留。"
        >
          <Segmented
            value={draft.cardVariant}
            items={[
              { id: 'default', label: '默认卡片' },
              { id: 'plain', label: '朴素卡片' },
            ]}
            onChange={(value) => {
              if (value !== 'default' && value !== 'plain') return;
              updateScene('collections', (current) => ({
                ...current,
                cardVariant: value,
              }));
            }}
          />
          <View style={styles.row}>
            <Switch
              value={draft.cardBare}
              onChange={(cardBare) =>
                updateScene('collections', (current) => ({
                  ...current,
                  cardBare,
                }))
              }
              accessibilityLabel="卡片裸壳"
            />
            <Switch
              value={draft.cardFill}
              onChange={(cardFill) =>
                updateScene('collections', (current) => ({
                  ...current,
                  cardFill,
                }))
              }
              accessibilityLabel="卡片撑满"
            />
          </View>
          <View style={draft.cardFill ? styles.fillFrame : undefined}>
            <Card
              variant={draft.cardVariant}
              bare={draft.cardBare}
              fill={draft.cardFill}
            >
              <Text style={styles.cardText}>当前配置卡片</Text>
            </Card>
          </View>
          <Card variant="default" testID="collections-card-default">
            <Text style={styles.cardText}>默认卡片</Text>
          </Card>
          <Card variant="plain" testID="collections-card-plain">
            <Text style={styles.cardText}>朴素卡片</Text>
          </Card>
          <Card variant="default" bare testID="collections-card-bare">
            <Text style={styles.cardText}>默认裸壳卡片</Text>
          </Card>
          <View style={styles.fillFrame}>
            <Card fill testID="collections-card-fill">
              <Text style={styles.cardText}>撑满卡片</Text>
            </Card>
          </View>
        </SectionCard>

        <SectionCard
          title="Ribbon"
          description="业务只提供文案与 tone；Design 固定右上条带、折角和主题色。"
        >
          <View style={styles.ribbonStack}>
            <Ribbon
              label="数量待补充"
              tone="brand"
              testID="collections-ribbon-brand"
            >
              <Card variant="plain">
                <Text style={styles.cardText}>待补充数量的商品</Text>
              </Card>
            </Ribbon>
            <Ribbon
              label="未匹配"
              tone="danger"
              accessibilityLabel="该商品未匹配"
              testID="collections-ribbon-danger"
            >
              <Card variant="plain">
                <Text style={styles.cardText}>等待人工匹配的商品</Text>
              </Card>
            </Ribbon>
          </View>
        </SectionCard>

        <SectionCard title="Cell 与 List">
          <List testID="collections-list-grouped">
            <Cell
              title="静态信息"
              desc="该行没有操作角色"
              extra={{ kind: 'text', value: '只读' }}
              testID="collections-cell-static"
            />
            <Cell
              title="可操作行"
              desc="带箭头与可访问名称"
              arrow
              onPress={() => record('Cell', '点击', '可操作行已触发')}
              testID="collections-cell-action"
            />
            <Cell
              title="列表内控制项"
              extra={{
                kind: 'control',
                node: (
                  <Switch
                    value={draft.cellControlEnabled}
                    onChange={(cellControlEnabled) =>
                      updateScene('collections', (current) => ({
                        ...current,
                        cellControlEnabled,
                      }))
                    }
                    accessibilityLabel="列表内控制项"
                  />
                ),
              }}
              testID="collections-cell-control"
            />
            <Cell
              title="危险操作"
              danger
              arrow
              onPress={() => record('Cell', '危险操作', '危险行已触发')}
              testID="collections-cell-danger"
            />
            <Cell
              title="禁用行"
              desc="禁用时移除行为"
              disabled
              arrow
              onPress={() => record('Cell', '点击', '禁用行不应触发')}
              testID="collections-cell-disabled"
            />
          </List>
          <List flush divider="full" testID="collections-list-full">
            <Cell title="全宽分隔甲" />
            <Cell title="全宽分隔乙" />
          </List>
          <List flush divider="none" testID="collections-list-none">
            <Cell title="无分隔甲" />
            <Cell title="无分隔乙" />
          </List>
        </SectionCard>

        <SectionCard title="Grid">
          <Grid
            items={staticGridItems}
            columns={2}
            card
            testID="collections-grid-2"
          />
          <Grid
            items={actionGridItems}
            columns={4}
            card
            onPress={(item) =>
              record('Grid', '选择', `已选择${item.label}入口`)
            }
            testID="collections-grid-4"
          />
          <Grid
            items={sixColumnGridItems}
            columns={6}
            card={false}
            onPress={(item) =>
              record('Grid', '选择', `已选择${item.label}入口`)
            }
            testID="collections-grid-6"
          />
        </SectionCard>

        <SectionCard title="EntryCard">
          <View style={styles.row}>
            <EntryCard
              icon="info"
              title="静态入口"
              sub="带副标题"
              testID="collections-entry-static"
            />
            <EntryCard
              icon="arrow-right"
              title="打开入口"
              onPress={() => record('EntryCard', '点击', '入口卡片已触发')}
              testID="collections-entry-action"
            />
          </View>
        </SectionCard>

        <SectionCard
          title="Carousel"
          description="轮播默认不挂载；开启后演示空、单页、多页展示与多页操作。"
        >
          <Button
            label={draft.carouselEnabled ? '卸载轮播演示' : '挂载轮播演示'}
            variant="secondary"
            onPress={() => setCarouselEnabled(!draft.carouselEnabled)}
          />
          {!draft.carouselEnabled ? (
            <Text style={styles.fact}>Carousel 组件未挂载</Text>
          ) : (
            <View style={styles.specimenStack}>
              <View style={styles.row}>
                <Switch
                  value={draft.carouselAutoplay}
                  onChange={(carouselAutoplay) =>
                    updateScene('collections', (current) => ({
                      ...current,
                      carouselAutoplay,
                    }))
                  }
                  accessibilityLabel="轮播自动播放"
                />
                <Switch
                  value={draft.carouselLoop}
                  onChange={(carouselLoop) =>
                    updateScene('collections', (current) => ({
                      ...current,
                      carouselLoop,
                    }))
                  }
                  accessibilityLabel="轮播循环"
                />
              </View>
              {reducedMotion && draft.carouselAutoplay ? (
                <Text style={styles.fact}>
                  自动播放已因系统减少动态效果而停止
                </Text>
              ) : null}
              <Empty
                title="空数据由消费方显示空态"
                desc="Carousel 本身不负责空数据内容。"
                icon="image"
                testID="collections-empty-data-boundary"
              />
              <Carousel
                data={oneCarouselItem}
                keyExtractor={(item) => item.id}
                height={96}
                itemSize={280}
                indicatorPosition="bottom"
                renderItem={renderCarouselItem}
                testID="collections-carousel-one"
              />
              <Carousel
                data={displayCarouselItems}
                keyExtractor={(item) => item.id}
                height={96}
                itemSize={280}
                indicatorPosition="bottom"
                renderItem={renderCarouselItem}
                testID="collections-carousel-display"
              />
              <Carousel
                ref={carouselRef}
                data={actionCarouselItems}
                keyExtractor={(item) => item.id}
                height={112}
                itemSize={280}
                autoplay={draft.carouselAutoplay}
                autoplayInterval={3000}
                loop={draft.carouselLoop}
                indicatorPosition="overlay-bottom-right"
                onPressItem={(item) =>
                  record('Carousel', '点击', `已选择${item.title}`)
                }
                getAccessibilityLabel={(item) => item.title}
                renderItem={renderCarouselItem}
                testID="collections-carousel-action"
              />
              <Text style={styles.fact}>
                最近读取页：第 {draft.carouselIndex + 1} 项
              </Text>
              <View style={styles.row}>
                <Button
                  label="下一项"
                  variant="secondary"
                  onPress={() => {
                    carouselRef.current?.next({ animated: true });
                    record('Carousel', '移动', '已请求下一项');
                  }}
                />
                <Button
                  label="上一项"
                  variant="secondary"
                  onPress={() => {
                    carouselRef.current?.prev({ animated: true });
                    record('Carousel', '移动', '已请求上一项');
                  }}
                />
                <Button
                  label="跳到第一项"
                  variant="secondary"
                  onPress={() => {
                    carouselRef.current?.scrollTo({
                      index: 0,
                      animated: false,
                    });
                    record('Carousel', '移动', '已请求跳到第一项');
                  }}
                />
                <Button
                  label="读取当前页"
                  variant="secondary"
                  onPress={() => {
                    const carouselIndex =
                      carouselRef.current?.getCurrentIndex();
                    if (carouselIndex === undefined) {
                      record('Carousel', '读取', '轮播尚未挂载');
                      return;
                    }
                    updateScene('collections', (current) => ({
                      ...current,
                      carouselIndex,
                    }));
                    record(
                      'Carousel',
                      '读取',
                      `当前为第 ${carouselIndex + 1} 项`
                    );
                  }}
                />
              </View>
            </View>
          )}
        </SectionCard>
      </View>
    </ShowcaseScaffold>
  );
}
