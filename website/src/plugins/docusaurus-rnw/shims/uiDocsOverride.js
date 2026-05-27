/**
 * Docs-only override —— 重新导出 `@/components/ui` barrel,但把对 consumer-provided
 * 资产有依赖的组件(如 Logo 需要 `source` prop)包一层默认资产,让 mdx 里写 `<Logo />`
 * 不传 prop 也能视觉成立。
 *
 * design 组件库本体保持"无品牌资产"的设计原则(消费者自传 logo),这层只是 docs
 * site 的便利适配,不影响 publish API 与真 RN 端行为。
 *
 * webpack alias 把 `@/components/ui$` 重定向到本文件(见 plugin index.js)。
 */
'use strict';

const React = require('react');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const useBaseUrl = require('@docusaurus/useBaseUrl').default;
// 相对 require 路径:本文件在 website/src/plugins/docusaurus-rnw/shims/,
// 上溯 5 层(shims → docusaurus-rnw → plugins → src → website → repo 根)。
// eslint-disable-next-line @typescript-eslint/no-require-imports
const UI = require('../../../../../src/components/ui');

function Logo(props) {
  // useBaseUrl 给绝对路径前置 baseUrl(GitHub Pages 子路径 `/react-native-design/`),
  // dev 默认 baseUrl 也走同一函数,无需手动判断环境。
  const logoUri = useBaseUrl('/img/logo.png');
  return React.createElement(UI.Logo, {
    source: { uri: logoUri },
    ...props,
  });
}

module.exports = {
  ...UI,
  Logo,
};
