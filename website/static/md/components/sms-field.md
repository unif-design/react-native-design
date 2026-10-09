---
title: SmsField 短信字段
description: 受控输入与发送按钮，不内置请求或倒计时。
---

<!-- Generated from @unif/react-native-design@0.39.1; edit source documentation. -->

# SmsField 短信字段

组合 Input 与发送动作。调用方提供输入长度、文案和剩余秒数，并维护发送请求及计时。

```tsx
const SmsFieldDemo = () => {
  const [value, setValue] = useState('');
  const [remaining, setRemaining] = useState(0);
  return (
    <>
      <View style={{ gap: 12 }}>
        <SmsField
          value={value}
          onChangeText={setValue}
          remainingSeconds={remaining}
          maxLength={6}
          placeholder="输入六位数字"
          accessibilityLabel="演示短信码"
          sendLabel={remaining ? `${remaining}s` : '获取验证码'}
          sendAccessibilityLabel={
            remaining ? `${remaining} 秒后可重新获取验证码` : '获取验证码'
          }
          onSend={() => setRemaining(30)}
        />
        <Button
          label="结束演示冷却"
          variant="outline"
          onPress={() => setRemaining(0)}
        />
        <span className="demo-label">
          {remaining ? '由示例保持冷却状态，可手动结束' : '可以发送'} · 已输入{' '}
          {value.length} 位
        </span>
      </View>
    </>
  );
};
```

## 用法

```tsx
<SmsField
  value={code}
  onChangeText={setCode}
  remainingSeconds={remaining}
  maxLength={6}
  placeholder="请输入 6 位验证码"
  sendLabel={remaining > 0 ? `${remaining}s` : '获取验证码'}
  sendAccessibilityLabel={
    remaining > 0 ? `${remaining} 秒后可重新获取验证码` : '获取验证码'
  }
  sendDisabled={sending}
  onSend={requestSms}
/>
```

## API

公开类型：`SmsFieldProps`。

| 参数                                         | 类型                                 | 默认值   | 说明                           |
| -------------------------------------------- | ------------------------------------ | -------- | ------------------------------ |
| `value` / `onChangeText`                     | `string` / `(value: string) => void` | 必填     | 受控原文                       |
| `remainingSeconds`                           | `number`                             | 必填     | 大于零时禁用发送；不创建计时器 |
| `sendLabel` / `onSend`                       | `string` / `() => void`              | 必填     | 发送按钮当前文案与事件         |
| `sendAccessibilityLabel`                     | `string`                             | 按钮文案 | 可给倒计时提供完整读屏说明     |
| `sendDisabled`                               | `boolean`                            | `false`  | 调用方控制发送禁用             |
| `maxLength` / `placeholder`                  | `number` / `string`                  | —        | 长度与提示不预设六位或业务文案 |
| `editable` / `accessibilityLabel` / `testID` | Input 对应字段                       | 沿 Input | 输入状态、名称与定位           |

使用 `number-pad`、`sms-otp` 和 `oneTimeCode` 原生提示，前缀为 mail 图标。手机号、用途、请求去重、身份和冷却计时均由应用维护。明暗主题、字号与交互沿 Input；原生展厅位于「表单与输入」。
