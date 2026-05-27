import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Unif Design',
  tagline: '@unif/react-native-design · 移动优先设计系统',
  favicon: 'img/logo.png',

  url: 'https://unif.design',
  baseUrl: '/',

  organizationName: 'unif-design',
  projectName: 'react-native-design',

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
          sidebarId: 'docsSidebar',
          position: 'left',
          label: '文档',
        },
        {
          href: 'https://www.npmjs.com/package/@unif/react-native-design',
          label: 'npm',
          position: 'right',
        },
        {
          href: 'https://github.com/unif-design/react-native-design',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: '文档',
          items: [
            { label: '简介', to: '/docs/intro' },
            { label: 'Button', to: '/docs/button' },
          ],
        },
        {
          title: '资源',
          items: [
            { label: 'npm', href: 'https://www.npmjs.com/package/@unif/react-native-design' },
            { label: 'GitHub', href: 'https://github.com/unif-design/react-native-design' },
          ],
        },
      ],
      copyright: '@unif/react-native-design · MIT',
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: ['bash', 'tsx', 'jsx'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
