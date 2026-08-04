type PeerRequirementIdentity = {
  hash: string;
  providerLocator: string;
  packageName: string;
};

/** provider 存在，但版本不满足请求方 range。 */
export type ProvidedMismatchSummary = PeerRequirementIdentity & {
  kind: 'provided-mismatch';
  providerVersion: string;
};

/** provider 完全没有声明所请求的 peer。 */
export type MissingProviderSummary = PeerRequirementIdentity & {
  kind: 'missing-provider';
};

/** `yarn explain peer-requirements` 列表行:一条失败的 peer 提供关系。 */
export type PeerRequirementSummary =
  | ProvidedMismatchSummary
  | MissingProviderSummary;

/** 明细里的单个请求方及其 range。 */
export type PeerRequest = { requester: string; range: string };

/** `yarn explain peer-requirements <hash>` 明细。 */
export type PeerRequirementDetail =
  | (ProvidedMismatchSummary & { requests: PeerRequest[] })
  | (MissingProviderSummary & { requests: PeerRequest[] });

/** 审计结果:已获准例外的 hash 列表 + 必须让命令失败的错误。 */
export type PeerAuditResult = {
  knownExceptions: string[];
  errors: string[];
};

export type RuntimePeerManifest = {
  peerDependencies?: Readonly<Record<string, string>>;
  dependencies?: Readonly<Record<string, string>>;
  devDependencies?: Readonly<Record<string, string>>;
};

export declare function parseRequirementList(
  output: string
): PeerRequirementSummary[];
export declare function parseRequirementDetail(
  hash: string,
  output: string
): PeerRequirementDetail;
export declare function deriveAuditedRuntimePackages(
  rootManifest: RuntimePeerManifest,
  exampleManifest: RuntimePeerManifest,
  websiteManifest: RuntimePeerManifest
): Set<string>;
export declare function auditRuntimePeers(
  summaries: readonly PeerRequirementSummary[],
  details: ReadonlyMap<string, PeerRequirementDetail>,
  auditedPackages: ReadonlySet<string>
): PeerAuditResult;
