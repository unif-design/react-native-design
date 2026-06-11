export type StatusDotStatus = 'pending' | 'active' | 'done';

/**
 * `flat`：pending/active 底色透明（任务列表风格）。
 * `soft`：pending = surface、active = primaryContainer，常用于推理链。
 */
export type StatusDotTone = 'flat' | 'soft';

export type StatusDotProps = {
  status: StatusDotStatus;
  size?: number;
  tone?: StatusDotTone;
  /** E2E / 测试定位 */
  testID?: string;
};
