/**
 * 占位 stub —— portal mdx 里有 `import { SuggestionList } from '@/components/chat'`
 * 引用 chat 组件做 LiveDemo,但 design 包(组件库)不含 chat 业务组件。
 *
 * 为了"1:1 复刻 portal mdx"且不阻塞 build,把 `@/components/chat` 在 webpack
 * 解析阶段定向到这个 stub。stub 渲染一个最小可见的 chip 列表代替真 SuggestionList,
 * 让 empty.mdx 的 Empty + suggestion 组合 demo 视觉上仍合理。
 *
 * 这是 docs-only 的解决方案,不进 design 包的 publish API。
 */
'use strict';

const React = require('react');
const { View, Text, Pressable } = require('react-native');

function SuggestionList({ items = [], onPress, align = 'center' }) {
  return React.createElement(
    View,
    {
      style: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent:
          align === 'center'
            ? 'center'
            : align === 'right'
            ? 'flex-end'
            : 'flex-start',
      },
    },
    items.map((item, i) =>
      React.createElement(
        Pressable,
        {
          key: i,
          onPress: () => onPress && onPress(item),
          style: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: '#EDEDED',
            backgroundColor: '#FFF',
          },
        },
        React.createElement(
          Text,
          { style: { fontSize: 12, color: '#666' } },
          (item.leading === 'spark' ? '✦ ' : '') + (item.label || ''),
        ),
      ),
    ),
  );
}

module.exports = { SuggestionList };
