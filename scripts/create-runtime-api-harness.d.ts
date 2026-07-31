/** 全部钉死的版本基线 —— 任一漂移都让脚本失败。 */
export declare const EXPECTED: {
  cli: '20.1.0';
  template: '0.86.2';
  react: '19.2.3';
  reactNative: '0.86.2';
};

/** yarn.lock 中一个待校验校验和的包。 */
export type LockedPackage = { name: string; version: string };

export declare function assertExactVersion(
  name: string,
  actual: string | undefined,
  expected: string
): void;

/** 校验官方 template 自带 app manifest 的 React / RN / CLI 版本。 */
export declare function assertTemplateManifest(
  manifest: Record<string, unknown>
): void;

/** 在 yarn.lock 中定位条目块并返回其 checksum;不存在返回 `null`。 */
export declare function findLockChecksum(
  lockText: string,
  name: string,
  version: string
): string | null;

export declare function assertLockChecksums(
  lockText: string,
  packages: readonly LockedPackage[]
): void;

/** 脚本自持目标目录,不接受调用方传入目录参数。 */
export declare function assertNoDestinationArgument(
  argv: readonly string[]
): void;

/** 拒绝任何落在 legacy `example/` 之内的路径。 */
export declare function assertOutsideExample(targetPath: string): void;

export declare function buildScaffoldArgs(
  templatePath: string,
  targetDirectory: string
): string[];

export declare function buildHarnessManifest(
  rootManifest: Record<string, unknown>,
  resolvedVersions: Readonly<Record<string, string>>,
  tarballPath: string
): Record<string, unknown>;
