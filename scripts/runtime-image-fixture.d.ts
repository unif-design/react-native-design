export type RuntimeImageFixtureCliOptions = {
  help: boolean;
  host: string;
  port: number;
};

export type RuntimeImageFixtureAddress = {
  host: string;
  port: number;
  origin: string;
};

export type RuntimeImageFixture = {
  listen(options?: {
    host?: string;
    port?: number;
  }): Promise<RuntimeImageFixtureAddress>;
  close(): Promise<void>;
};

/** 严格解析 zero-dependency fixture 的 CLI 参数。 */
export declare function parseCliOptions(
  argv: readonly string[]
): RuntimeImageFixtureCliOptions;

/** 创建隔离的 HTTP fixture；调用方负责在结束时执行 `close()`。 */
export declare function createRuntimeImageFixture(): RuntimeImageFixture;
