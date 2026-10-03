import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Text, View } from 'react-native';
import { radius, useThemedStyles } from '../../../theme';
import { IconButton } from '../IconButton';
import { Thumbnail } from '../Thumbnail';
import { Carousel, type CarouselRef } from 'react-native-reanimated-carousel';
import { DELETE_LABEL, IMAGE_UNAVAILABLE } from './constants';
import { makeStyles } from './styles';
import type {
  ImagePreviewHandle,
  ImagePreviewProps,
  ImagePreviewSelection,
  ImagePreviewScrollRequest,
} from './types';

export const ImagePreview = forwardRef<ImagePreviewHandle, ImagePreviewProps>(
  function ImagePreviewInner(
    {
      items,
      width,
      height,
      initialId,
      onCurrentChange,
      onRequestDelete,
      style,
      testID,
    },
    ref
  ) {
    const styles = useThemedStyles(makeStyles);
    const carouselRef = useRef<CarouselRef>(null);
    const mounted = useRef(false);
    const moving = useRef(false);
    const pendingScroll = useRef<ImagePreviewScrollRequest | undefined>(
      undefined
    );
    const [selection, setSelection] = useState<ImagePreviewSelection>(() => ({
      items,
      index: Math.max(
        0,
        items.findIndex((item) => item.id === initialId)
      ),
      initialized: items.length > 0,
      carouselRevision: 0,
    }));

    if (selection.items !== items) {
      const retainedIndex = items.findIndex(
        (item) => item.id === selection.items[selection.index]?.id
      );
      const identityChanged =
        items.length !== selection.items.length ||
        items.some((item, index) => item.id !== selection.items[index]?.id);
      setSelection({
        items,
        // SDK 的非动画定位不能撤回已排队的旧完成；只重建在途且身份集合变化的轮播。
        carouselRevision:
          selection.carouselRevision +
          (moving.current && identityChanged ? 1 : 0),
        initialized: selection.initialized || items.length > 0,
        index: !selection.initialized
          ? Math.max(
              0,
              items.findIndex((item) => item.id === initialId)
            )
          : retainedIndex >= 0
            ? retainedIndex
            : Math.max(0, Math.min(selection.index, items.length - 1)),
      });
    }

    const current = items[selection.index];
    const committed = useRef(selection);
    const currentChange = useRef(onCurrentChange);
    useLayoutEffect(() => {
      mounted.current = true;
      committed.current = selection;
      currentChange.current = onCurrentChange;
      return () => {
        mounted.current = false;
      };
    }, [selection, onCurrentChange]);

    useLayoutEffect(() => {
      moving.current = false;
    }, [selection.carouselRevision]);

    useEffect(() => {
      const request = pendingScroll.current;
      pendingScroll.current = undefined;
      if (!request) return;
      const index = committed.current.items.findIndex(
        (item) => item.id === request.id
      );
      if (index >= 0)
        carouselRef.current?.scrollTo({ index, animated: request.animated });
    }, [selection.carouselRevision]);

    const notifiedId = useRef<string | undefined>(undefined);
    useEffect(() => {
      // 待交接命令可能已同步完成，通知与句柄读取同一份已提交事实。
      const displayed = committed.current.items[committed.current.index];
      if (displayed?.id === notifiedId.current) return;
      notifiedId.current = displayed?.id;
      if (displayed) currentChange.current?.(displayed);
    }, [current, onCurrentChange]);

    useImperativeHandle(
      ref,
      () => ({
        getCurrent: () =>
          mounted.current
            ? committed.current.items[committed.current.index]
            : undefined,
        scrollTo: (id, animated = true) => {
          if (!mounted.current) return;
          const index = committed.current.items.findIndex(
            (item) => item.id === id
          );
          if (index < 0) return;
          if (moving.current || pendingScroll.current) {
            // 新命令隔离旧完成投递；新 ref 就绪后原样交接 animated。
            pendingScroll.current = { id, animated };
            const next = {
              ...committed.current,
              carouselRevision: committed.current.carouselRevision + 1,
            };
            committed.current = next;
            setSelection(next);
          } else {
            carouselRef.current?.scrollTo({ index, animated });
          }
        },
      }),
      []
    );

    // SDK 只协调身份变化；source、label、busy 更新不应打断当前动画。
    const data = useMemo(() => items.map((item) => item.id), [items]);
    if (!current) return null;

    return (
      <View style={[styles.container, style]} testID={testID}>
        <Carousel
          key={selection.carouselRevision}
          ref={carouselRef}
          data={data}
          defaultIndex={selection.index}
          loop={false}
          itemSize={width}
          style={{ width, height }}
          keyExtractor={(id) => id}
          testID={testID ? `${testID}-carousel` : undefined}
          onScrollStart={() => {
            if (
              mounted.current &&
              selection.carouselRevision === committed.current.carouselRevision
            ) {
              moving.current = true;
            }
          }}
          onSnapToItem={(index) => {
            const latest = committed.current;
            if (
              !mounted.current ||
              selection.carouselRevision !== latest.carouselRevision ||
              items.length !== latest.items.length ||
              items.some(
                (item, itemIndex) => item.id !== latest.items[itemIndex]?.id
              )
            )
              return;
            moving.current = false;
            const id = items[index]?.id;
            const nextIndex = latest.items.findIndex((item) => item.id === id);
            if (nextIndex >= 0 && nextIndex !== latest.index) {
              const next = { ...latest, index: nextIndex };
              // SDK 已完成落位；句柄同步可读，不等待 React 下一次提交。
              committed.current = next;
              setSelection(next);
              notifiedId.current = id;
              currentChange.current?.(next.items[nextIndex]!);
            }
          }}
          renderItem={({ item: id, index }) => {
            const item = items.find((candidate) => candidate.id === id)!;
            return (
              <View style={[styles.media, { width, height }]}>
                {item.source === undefined ? (
                  <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>
                      {IMAGE_UNAVAILABLE}
                    </Text>
                  </View>
                ) : (
                  <Thumbnail
                    source={item.source}
                    size={{ width, height, borderRadius: radius.xl }}
                    resizeMode="contain"
                    imageStyle={styles.image}
                    accessibilityLabel={item.label ?? `图片第 ${index + 1} 张`}
                    fallback={
                      <View style={styles.placeholder}>
                        <Text style={styles.placeholderText}>
                          {IMAGE_UNAVAILABLE}
                        </Text>
                      </View>
                    }
                  />
                )}
                <View pointerEvents="none" style={styles.border} />
              </View>
            );
          }}
        />
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            第{selection.index + 1}/{items.length}张
          </Text>
        </View>
        {current.canDelete && onRequestDelete ? (
          <IconButton
            icon="trash"
            size="sm"
            variant="neutral"
            disabled={current.deleting}
            accessibilityLabel={DELETE_LABEL}
            style={styles.deleteButton}
            onPress={() => onRequestDelete(current)}
          />
        ) : null}
      </View>
    );
  }
);
