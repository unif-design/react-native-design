---
sidebar_position: 2
title: Textarea 多行输入
description: '多行输入，按内容和高度边界调整输入表面。'
---

<!-- Generated from @unif/react-native-design@0.32.2; edit source documentation. -->

# Textarea 多行输入

Textarea 固定 `multiline` 并顶对齐；单行请用 [Input](input.md)。它与 Input 使用相同严格受控/非受控 union、slot、错误和 ref 契约。

```tsx
const TextareaDemo = () => {
  const [note, setNote] = useState(
    '首次布局按实际宽度测量，多行文字不需要业务层计算高度。\n'.repeat(5)
  );
  return (
    <>
      <Textarea
        value={note}
        onChangeText={setNote}
        placeholder="拜访备注"
        accessibilityLabel="拜访备注"
      />
    </>
  );
};
```

## 内容布局与消费交接

```tsx
const TextareaLayoutDemo = () => {
  const [value, setValue] = useState('');
  const [fontScale, setFontScale] = useState(1);
  const [narrow, setNarrow] = useState(false);
  const [limited, setLimited] = useState(true);
  const [plain, setPlain] = useState(false);
  const ref = useRef(null);
  return (
    <>
      <View style={{ gap: 16 }}>
        <ThemeProvider fontScale={fontScale}>
          <View style={{ width: narrow ? 180 : '100%' }}>
            <Textarea
              surface={plain ? 'plain' : 'default'}
              ref={ref}
              value={value}
              onChangeText={setValue}
              minHeight={44}
              maxHeight={limited ? 120 : undefined}
              accessibilityLabel="多行布局验证"
              placeholder="输入多行文字"
              submitBehavior="newline"
              testID="textarea-layout-demo"
            />
          </View>
        </ThemeProvider>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Button
            label="填入长文"
            onPress={() =>
              setValue('中文输入保持原文，依据实际宽度测量高度。\n'.repeat(12))
            }
          />
          <Button label="缩为短文" onPress={() => setValue('一行短文')} />
          <Button label="外部清空" onPress={() => setValue('')} />
          <Button label="切换宽度" onPress={() => setNarrow(!narrow)} />
          <Button
            label="切换字号"
            onPress={() => setFontScale(fontScale === 1 ? 2 : 1)}
          />
          <Button label="切换高度上限" onPress={() => setLimited(!limited)} />
          <Button label="切换输入表面" onPress={() => setPlain(!plain)} />
          <Button label="聚焦输入" onPress={() => ref.current?.focus()} />
          <Button label="失焦输入" onPress={() => ref.current?.blur()} />
        </View>
      </View>
    </>
  );
};
```

输入表面（包括内部 padding 和边框）在 minHeight / maxHeight 范围内增长与缩短；错误说明在表面外，不占上限。首次长文、外部 value 更新、宽度与应用字号变化后，按真实内容重新测量；超过上限默认内部滚动，不截断文字。省略 maxHeight 可持续增长。

受控清空通过外部 value 更新，ref 仍仅有 focus / blur。onFocus / onBlur 与 onContentSizeChange 原样交付；contentSize 是文字测量，组合区的总高度应由消费者自己的 onLayout 测量。页面负责键盘避让，回车可显式设置 submitBehavior="newline"，发送与语音采集留在消费者。

## 用法

```tsx
<Textarea defaultValue="首次草稿" minHeight={120} maxHeight={240} />
<Textarea value={note} onChangeText={setNote} error={note ? undefined : '请输入备注'} />
<Textarea value={note} onChangeText={setNote} surface="plain" minHeight={44} maxHeight={120} />
```

`defaultValue` 只用于首次初始化；受控模式必须同时传 `value` 和 `onChangeText`，两种 mode 不能中途切换。

## 嵌入复合输入

`surface` 可选 `default`（缺省）或 `plain`。`default` 绘制独立输入的背景、圆角、边框及焦点／错误描边。`plain` 用于外层卡片已经提供表面的复合输入，不绘制这些装饰；文字、焦点事件、错误说明、禁用状态及最小触达区域保持原契约。

两种表面都保留水平 `space[5]` 和垂直 `space[4]` 的文字内边距；消费者不需要再给文字区叠加内边距。`plain` 没有边框，其垂直内边距合计为 `2 * space[4]`。`minHeight`／`maxHeight` 仍包含这些间距；例如消费者按四行文字计算上限时，应将文字高度与这部分垂直间距相加。`containerStyle` 只作用于外层布局，不能用于穿透修改内部输入表面。

## 高度与 a11y

- `minHeight` 默认 96，必须是有限且至少 44 的数；非法值回退 96。
- `maxHeight` 缺省时不限制；只有有限且不小于归一化后的 min 时生效，否则回退为无上限。
- `containerStyle` 不能覆盖高度、min/max 尺寸、min/max 宽或 `overflow`，运行时 JS 传入也会剥除。
- `leading`/`trailing` 只接受 `TextFieldSlot`。action slot 有 44×44pt 实际 frame，字段不可编辑时 action 也不可操作。
- ref 是 `TextFieldHandle`，只有 `focus()` / `blur()`；`readOnly` 改用 `editable={false}`。

错误文字 Android 使用 polite live region；iOS 只播报挂载后的非空错误变更。请给没有可见标签的字段传 `accessibilityLabel`。
