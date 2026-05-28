import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Unif Design',
  tagline: '@unif/react-native-design · 移动优先设计系统',
  favicon: 'img/logo.png',

  // 部署到 GitHub Pages 默认域名:https://unif-design.github.io/react-native-design/
  // 后续接自定义域名只需把 url 改成新域名 + baseUrl 改为 '/' + 加 static/CNAME 文件。
  url: 'https://unif-design.github.io',
  baseUrl: '/react-native-design/',

  organizationName: 'unif-design',
  projectName: 'react-native-design',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          editUrl: undefined,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    // 让文档站直接 import `@unif/react-native-design` 源码并在浏览器渲染。
    // 通过 webpack alias 把 npm 包名映射到 ../src/index.tsx,保持源码 hot reload。
    './src/plugins/docusaurus-rnw',
  ],

  clientModules: [
    // 在 React 树启动前给 window 上注入 `global = window`,
    // 让 @gorhom/bottom-sheet 等 RN 库的 lib/module/*.js 顶层 `global.X` 跑通。
    './src/clientModules/rn-globals.ts',
  ],

  themeConfig: {
    image: 'img/logo.png',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Unif Design',
      logo: {
        alt: 'Unif',
        src: 'img/logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'componentsSidebar',
          position: 'left',
          label: '组件',
        },
        {
          type: 'docSidebar',
          sidebarId: 'designSidebar',
          position: 'left',
          label: '设计',
        },
        {
          type: 'html',
          position: 'right',
          value: '<span class="navbar-version">v0.2.0</span>',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: '设计',
          items: [
            { label: '设计原则', to: '/docs/design/principles' },
            { label: '设计令牌', to: '/docs/design/tokens/colors' },
            { label: '不要这样做', to: '/docs/design/donts' },
          ],
        },
        {
          title: '组件',
          items: [
            { label: '概览', to: '/docs/components' },
            { label: 'Button', to: '/docs/components/button' },
            { label: 'NavBar', to: '/docs/components/navbar' },
            { label: 'Cell · List', to: '/docs/components/cell' },
          ],
        },
      ],
      copyright: 'Unif Design System · v0.2.0',
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ['bash', 'tsx', 'jsx'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
