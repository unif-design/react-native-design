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

/** 验证 manual screen 消费 safe-area inset,同时让全屏 Hosts 留在内容容器外。 */
export declare function assertRuntimeScreenSafeArea(): void;

/** source-injectable pure seam;验证 Provider 包住 Theme / 内容 / 全屏 Hosts 的结构。 */
export declare function assertRuntimeScreenSafeAreaSource(source: string): void;

export declare function buildScaffoldArgs(
  templatePath: string,
  targetDirectory: string
): string[];

export declare function buildHarnessManifest(
  rootManifest: Record<string, unknown>,
  resolvedVersions: Readonly<Record<string, string>>,
  tarballPath: string
): Record<string, unknown>;

/** 从根 direct descriptor 对应的 lock locator 解析并交叉验证 installed / peer。 */
export declare function resolveLockedDependency(
  rootManifest: Record<string, unknown>,
  lockText: string,
  installedVersions: Readonly<Record<string, string>>,
  name: string,
  peerRange?: string
): string;

export declare function buildNativeTemplateSnapshot(
  templateFiles: Readonly<Record<string, string>>
): Record<string, string>;

export declare function assertNativeTemplateSnapshot(
  snapshot: Readonly<Record<string, string>>,
  generatedFiles: Readonly<Record<string, string>>
): void;

export type InstallHarnessSeam = {
  nodePath?: string;
  execute?: (command: string, args: readonly string[], cwd: string) => void;
  exists?: (file: string) => boolean;
};

/** 首次 install 生成 owned temp lock,随后用同一 manifest / lock immutable 复验。 */
export declare function installHarnessDependencies(
  appDir: string,
  yarnPath: string,
  seam?: InstallHarnessSeam
): void;

/** 失败时删除精确 owned temp parent;成功时保留供人工验收。 */
export type OwnedTempCleanupSeam = {
  tempRoot?: string;
  remove?: (target: string, options: { recursive: true; force: true }) => void;
};

export declare function runWithOwnedTempCleanup<T>(
  parent: string,
  operation: () => T,
  seam?: OwnedTempCleanupSeam
): T;

/** 返回 harness 使用图片 fixture 时的启动命令与平台 origin。 */
export declare function runtimeImageFixtureInstructions(
  port?: number
): string[];
