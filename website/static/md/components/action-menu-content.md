---
title: ActionMenuContent 操作菜单内容
description: 通用动作、忙碌禁用和可选二次确认。
---

<!-- Generated from @unif/react-native-design@0.38.0; edit source documentation. -->

# ActionMenuContent 操作菜单内容

展示通用动作与可选确认。应用提供操作含义、确认有效性及 Modal；内容组件独立于 Chat。

```tsx
const ActionMenuDemo = () => {
  const [open, setOpen] = useState(true);
  const [presentation, setPresentation] = useState('dialog');
  const [result, setResult] = useState('选择动作，删除会先确认');
  return (
    <>
      <View style={{ gap: 12 }}>
        <Segmented
          value={presentation}
          onChange={setPresentation}
          items={[
            { id: 'dialog', label: '居中' },
            { id: 'sheet', label: '底部' },
            { id: 'popover', label: '浮动' },
          ]}
        />
        <View style={{ height: 300 }}>
          {open ? (
            <ActionMenuContent
              title="演示操作"
              presentation={presentation}
              onClose={() => setOpen(false)}
              actions={[
                {
                  id: 'copy',
                  label: '复制',
                  icon: 'copy',
                  onPress: () => {
                    setResult('已选择复制');
                    setOpen(false);
                  },
                },
                {
                  id: 'busy',
                  label: '处理中',
                  loading: true,
                  onPress: () => {},
                },
                {
                  id: 'delete',
                  label: '删除',
                  icon: 'trash',
                  tone: 'danger',
                  confirmation: {
                    message: '删除这个演示项目？',
                    confirmLabel: '确认删除',
                  },
                  onPress: () => setResult('已确认删除演示项目'),
                },
              ]}
            />
          ) : (
            <Button label="打开菜单" onPress={() => setOpen(true)} />
          )}
        </View>
        <span className="demo-label">{result}</span>
      </View>
    </>
  );
};
```

## 用法

```tsx
<ActionMenuContent
  title="操作"
  presentation="sheet"
  actions={actions}
  onClose={closeModal}
/>
```

## API

`ActionMenuAction` 由 Design 定义：`id: string`、`label: string`、`onPress(): void` 必填；`icon?: IconName`、`accessibilityHint?`、`disabled?`、`loading?`、`tone?: 'neutral' | 'danger'` 和 `confirmation?: ActionMenuConfirmation` 可选。确认内容为 `message: string` 与 `confirmLabel: string`。

| 参数               | 类型                               | 默认值              | 说明                                                                  |
| ------------------ | ---------------------------------- | ------------------- | --------------------------------------------------------------------- |
| `actions`          | `readonly ActionMenuAction[]`      | 必填                | 调用方当前可用动作                                                    |
| `onClose`          | `() => void`                       | 必填                | 遮罩、普通取消与确认后的关闭请求                                      |
| `presentation`     | `'dialog' \| 'sheet' \| 'popover'` | `'dialog'`          | 居中、底部或纯浮动菜单卡片                                            |
| `title`            | `string`                           | —                   | 可选单行标题                                                          |
| `cancelLabel`      | `string`                           | `'取消'`            | 普通取消与返回菜单文案                                                |
| `style` / `testID` | `StyleProp<ViewStyle>` / `string`  | — / `'action-menu'` | 根容器样式与定位前缀                                                  |
| `contentStyle`     | `StyleProp<ViewStyle>`             | —                   | 内部动作卡片样式；嵌入已有面板时可显式调整上留白，根容器仍由style控制 |

普通动作只调用 `onPress`。有 confirmation 的动作先展示说明；确认时先 `onClose` 再调用该动作，取消确认仅返回菜单。禁用或加载时不能执行。正在确认的动作消失后回到菜单；业务目标是否仍然有效由应用在回调中复核。

底部模式需要 SafeAreaProvider，并将安全区加入底部内边距；浮动与居中模式不读取安全区。组件不挂载 Modal，不创建请求。原生展厅位于「操作与状态」；文字随主题和应用字号变化。

## 浮动菜单

`presentation="popover"` 直接显示竖向操作行，可选图标、文字、危险色、禁用及忙碌状态。默认宽度`r(200)`、圆角`r(20)`、主题描边和卡片阴影，每行至少44触达；确认按钮纵向布局，长确认文案不挤进两列。没有title时不增加标题，不增加单独的取消行。

此模式只提供菜单内容，不挂载Modal、遮罩或全屏容器，不计算锚点和安全区。输入框可以把它定位在加号上方；会话列表可以交给自己的窗口定位在长按行附近。`style`控制根卡片布局，`contentStyle`控制内部卡片；外部点击、返回和位置失效由宿主关闭。

普通动作继续只交`onPress`，宿主自行收起再执行。确认取消返回原菜单，确认提交先请求`onClose`再交当前动作。Web鼠标按下保留原输入焦点，点击和键盘激活仍只交一次动作；按钮禁用或忙碌时不能触发。
