import type { ImageSourcePropType } from 'react-native';

export type DrawerHeaderProps = {
  /** 用户名（首字符渲染到圆形 brand 头像里；source 提供时仅作为 a11y label / fallback） */
  name: string;
  /** 副标题（comGroup · role 之类的辅助信息） */
  subtitle?: string;
  /** 真实头像图片（URL 或 require）；提供时优先渲染 image，加载失败 fallback 到 letter */
  source?: ImageSourcePropType;
  /** E2E / 测试定位 */
  testID?: string;
};
