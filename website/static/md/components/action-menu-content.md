---
title: ActionMenuContent 操作菜单内容
description: 通用动作、忙碌禁用和可选二次确认。
---

<!-- Generated from @unif/react-native-design@0.34.0; edit source documentation. -->

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

`ActionMenuAction` 由 Design 定义：`id: string`、`label: string`、`onPress(): void` 必填；`disabled?`、`loading?`、`tone?: 'neutral' | 'danger'` 和 `confirmation?: ActionMenuConfirmation` 可选。确认内容为 `message: string` 与 `confirmLabel: string`。

| 参数               | 类型                              | 默认值              | 说明                             |
| ------------------ | --------------------------------- | ------------------- | -------------------------------- |
| `actions`          | `readonly ActionMenuAction[]`     | 必填                | 调用方当前可用动作               |
| `onClose`          | `() => void`                      | 必填                | 遮罩、普通取消与确认后的关闭请求 |
| `presentation`     | `'dialog' \| 'sheet'`             | `'dialog'`          | 居中卡片或底部卡片               |
| `title`            | `string`                          | —                   | 可选单行标题                     |
| `cancelLabel`      | `string`                          | `'取消'`            | 普通取消与返回菜单文案           |
| `style` / `testID` | `StyleProp<ViewStyle>` / `string` | — / `'action-menu'` | 根容器样式与定位前缀             |

普通动作只调用 `onPress`。有 confirmation 的动作先展示说明；确认时先 `onClose` 再调用该动作，取消确认仅返回菜单。禁用或加载时不能执行。正在确认的动作消失后回到菜单；业务目标是否仍然有效由应用在回调中复核。

需要 SafeAreaProvider；底部模式将安全区加入底部内边距。组件不挂载 Modal，不创建请求。原生展厅位于「操作与状态」；文字随主题和应用字号变化。
