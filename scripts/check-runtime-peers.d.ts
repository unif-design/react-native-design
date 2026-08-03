/** `yarn explain peer-requirements` 列表行:一条失败的 peer 提供关系。 */
export type PeerRequirementSummary = {
  hash: string;
  providerLocator: string;
  packageName: string;
  providerVersion: string;
};

/** 明细里的单个请求方及其 range。 */
export type PeerRequest = { requester: string; range: string };

/** `yarn explain peer-requirements <hash>` 明细。 */
export type PeerRequirementDetail = PeerRequirementSummary & {
  requests: PeerRequest[];
};

/** 审计结果:已获准例外的 hash 列表 + 必须让命令失败的错误。 */
export type PeerAuditResult = {
  knownExceptions: string[];
  errors: string[];
};

export declare function parseRequirementList(
  output: string
): PeerRequirementSummary[];
export declare function parseRequirementDetail(
  hash: string,
  output: string
): PeerRequirementDetail;
export declare function auditRuntimePeers(
  summaries: readonly PeerRequirementSummary[],
  details: ReadonlyMap<string, PeerRequirementDetail>
): PeerAuditResult;
