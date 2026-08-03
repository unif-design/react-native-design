/** 解析 TOML 配置；失败错误包含传入文件名和底层 parser 原因。 */
export declare function parseTomlConfig(
  source: string,
  filename: string
): Record<string, unknown>;
