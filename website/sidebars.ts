import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  designSidebar: [
    'UNIF-DESIGN',
    'getting-started',
    'design/intro',
    'design/principles',
    'design/voice',
    {
      type: 'category',
      label: '设计令牌',
      collapsed: false,
      items: [
        'design/tokens/colors',
        'design/tokens/typography',
        'design/tokens/spacing-radii-shadows',
        'design/tokens/motion',
      ],
    },
    'design/donts',
    'troubleshooting',
    'migration',
  ],

  componentsSidebar: [
    'components/overview',
    {
      type: 'category',
      label: '品牌',
      collapsed: true,
      items: ['components/logo', 'components/icons'],
    },
    {
      type: 'category',
      label: '通用',
      collapsed: false,
      items: [
        'components/button',
        'components/icon-button',
        'components/avatar',
        'components/tag',
        'components/thumbnail',
        'components/loading',
        'components/pulse',
        'components/status-dot',
      ],
    },
    {
      type: 'category',
      label: '表单',
      collapsed: true,
      items: [
        'components/input',
        'components/password-input',
        'components/search',
        'components/checkbox',
        'components/radio',
        'components/switch',
        'components/stepper',
        'components/form',
        'components/text-field',
        'components/textarea',
      ],
    },
    {
      type: 'category',
      label: '导航',
      collapsed: true,
      items: [
        'components/navbar',
        'components/tabbar',
        'components/tabs',
      ],
    },
    {
      type: 'category',
      label: '反馈',
      collapsed: true,
      items: [
        'components/toast',
        'components/empty',
        'components/skeleton',
      ],
    },
    {
      type: 'category',
      label: '数据展示',
      collapsed: true,
      items: [
        'components/cell',
        'components/card',
        'components/grid',
        'components/carousel',
      ],
    },
    {
      type: 'category',
      label: '业务复合',
      collapsed: true,
      items: [
        'components/avatar-with-ring',
        'components/version-pill',
        'components/glass-stats',
        'components/decorations',
      ],
    },
    {
      type: 'category',
      label: '其他',
      collapsed: true,
      items: [
        'components/blur-layer',
        'components/entry-card',
        'components/chip',
      ],
    },
  ],
};

export default sidebars;
