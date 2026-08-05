#!/usr/bin/env node
'use strict';

/**
 * runtime peer 漂移门禁。
 *
 * 唯一被允许的 peer 失败类型是 react-native-reanimated-carousel@5.0.0 对
 * react-native-gesture-handler 的错误 metadata(`>=2.9.0 <3.0.0`)。root、example、
 * website 三个 workspace 各有一条该已验证例外;除此之外任何 runtime peer 失败都必须
 * 让命令退出非零。
 *
 * 为什么不用全局 peer 忽略 / --legacy-peer-deps:那会连同真实的 major 漂移一起吞掉。
 * 这里把 allowlist 收窄到「包名 + 请求方 locator + 精确 range + provider major」四重匹配,
 * 任一维度变化都立刻失败。
 */

const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { stripVTControlCharacters } = require('node:util');
const semver = require('semver');

const REQUIRED_PROVIDERS = new Set([
  '@unif/react-native-design@workspace:.',
  '@unif/react-native-design-example@workspace:example',
  '@unif/react-native-design-website@workspace:website',
]);
const KNOWN_REQUESTER = 'react-native-reanimated-carousel@npm:5.0.0';
const KNOWN_RANGE = '>=2.9.0 <3.0.0';

function deriveAuditedRuntimePackages(
  rootManifest,
  exampleManifest,
  websiteManifest
) {
  return new Set([
    ...Object.keys(rootManifest.peerDependencies ?? {}),
    ...Object.keys(exampleManifest.dependencies ?? {}),
    ...Object.keys(websiteManifest.dependencies ?? {}),
  ]);
}

function isAuditedRuntimeFailure(summary, auditedPackages) {
  if (!auditedPackages.has(summary.packageName)) return false;
  // missing-provider 只有在 repository 可控的三个 workspace provider 上才属于本门禁；
  // Docusaurus 等外部 npm package 的内部 peer 拓扑不由本仓 manifest 控制。
  return (
    summary.kind !== 'missing-provider' ||
    REQUIRED_PROVIDERS.has(summary.providerLocator)
  );
}

/**
 * Yarn 会在 locator 尾部挂 ` [hash]` 虚拟实例标记(同一包在不同 peer 上下文各一份),
 * 该 hash 随依赖图变化而变、不承载版本语义。allowlist 必须比较去掉它之后的实体 locator,
 * 否则真实输出永远匹配不上、门禁形同虚设。版本号本身不在标记里,漂移仍然会被抓到。
 */
function stripVirtualInstance(locator) {
  return locator.replace(/\s+\[[0-9a-f]+\]$/u, '');
}

function parseRequirementList(output) {
  return stripVTControlCharacters(output)
    .split(/\r?\n/u)
    .map((line) => {
      // provider 名允许 scope(`@scope/name`),否则 scoped 包的失败行会被静默跳过 —— 门禁漏洞。
      const providedMismatch = line.match(
        /^(p[a-z0-9]+)\s+→\s+✘\s+(.+?)\s+provides\s+(@?[^@\s]+)@npm:([^\s]+)/u
      );
      if (providedMismatch) {
        return {
          kind: 'provided-mismatch',
          hash: providedMismatch[1],
          providerLocator: stripVirtualInstance(providedMismatch[2]),
          packageName: providedMismatch[3],
          providerVersion: providedMismatch[4],
        };
      }
      const missingProvider = line.match(
        /^(p[a-z0-9]+)\s+→\s+✘\s+(.+?)\s+(?:doesn't|does not) provide\s+(@?[^@\s]+)(?:\s+to\s+|$)/u
      );
      return missingProvider
        ? {
            kind: 'missing-provider',
            hash: missingProvider[1],
            providerLocator: stripVirtualInstance(missingProvider[2]),
            packageName: missingProvider[3],
          }
        : null;
    })
    .filter(Boolean);
}

function parseRequirementDetail(hash, output) {
  const normalizedOutput = stripVTControlCharacters(output);
  const provider = normalizedOutput.match(
    /^Package (.+?) is requested to provide ([^\s]+) by its descendants/mu
  );
  const providedMismatch = normalizedOutput.match(
    /^✘ Package (.+?) provides ([^\s]+) with version ([^,\s]+), which does not satisfy/mu
  );
  const missingProvider = normalizedOutput.match(
    /^✘ Package (.+?) (?:does not|doesn't) provide (\S+?)\.?$/mu
  );
  const requests = [
    ...normalizedOutput.matchAll(/[├└]─\s+(.+?)\s+\(via (.+?)\)\r?$/gmu),
  ].map((match) => ({
    requester: stripVirtualInstance(match[1]),
    range: match[2],
  }));
  const failure = providedMismatch ?? missingProvider;
  if (!provider || !failure || requests.length === 0) {
    throw new Error(`${hash}: 无法解析 yarn explain peer-requirements 明细`);
  }
  const providerLocator = stripVirtualInstance(provider[1]);
  const packageName = provider[2];
  if (
    providerLocator !== stripVirtualInstance(failure[1]) ||
    packageName !== failure[2]
  ) {
    throw new Error(`${hash}: yarn peer requirement 明细身份不一致`);
  }
  if (missingProvider) {
    return {
      kind: 'missing-provider',
      hash,
      providerLocator,
      packageName,
      requests,
    };
  }
  return {
    kind: 'provided-mismatch',
    hash,
    providerLocator,
    packageName,
    providerVersion: providedMismatch[3],
    requests,
  };
}

function auditRuntimePeers(summaries, details, auditedPackages) {
  if (!auditedPackages) {
    throw new TypeError(
      'auditRuntimePeers 缺少由 runtime manifests 派生的审计集合'
    );
  }
  const knownExceptions = [];
  const errors = [];
  const seenProviders = new Set();
  const acceptedProviders = new Set();
  for (const summary of summaries) {
    if (!isAuditedRuntimeFailure(summary, auditedPackages)) continue;
    const detail = details.get(summary.hash);
    if (!detail) {
      errors.push(`${summary.hash}: 缺少 runtime peer 明细`);
      continue;
    }
    if (
      detail.hash !== summary.hash ||
      detail.kind !== summary.kind ||
      detail.providerLocator !== summary.providerLocator ||
      detail.packageName !== summary.packageName ||
      (summary.kind === 'provided-mismatch' &&
        detail.providerVersion !== summary.providerVersion)
    ) {
      errors.push(`${summary.hash}: summary/detail 身份不一致`);
      continue;
    }
    if (summary.kind === 'missing-provider') {
      errors.push(
        `${summary.hash}: audited runtime peer missing provider —— ${detail.providerLocator} does not provide ${detail.packageName}`
      );
      continue;
    }
    if (!REQUIRED_PROVIDERS.has(detail.providerLocator)) {
      errors.push(
        `${summary.hash}: 未获准的 runtime peer provider ${detail.providerLocator}`
      );
      continue;
    }
    const knownRequest = detail.requests.filter(
      (request) => request.requester === KNOWN_REQUESTER
    );
    const otherRequests = detail.requests.filter(
      (request) => request.requester !== KNOWN_REQUESTER
    );
    const allowed =
      detail.packageName === 'react-native-gesture-handler' &&
      semver.satisfies(detail.providerVersion, '>=3.0.0 <4.0.0') &&
      knownRequest.length === 1 &&
      knownRequest[0].range === KNOWN_RANGE &&
      otherRequests.every((request) =>
        semver.satisfies(detail.providerVersion, request.range, {
          includePrerelease: true,
        })
      );
    if (!allowed) {
      errors.push(
        `${summary.hash}: 未获准的 runtime peer failure —— ${detail.providerLocator} provides ${detail.packageName}@${detail.providerVersion}`
      );
      continue;
    }
    if (seenProviders.has(detail.providerLocator)) {
      errors.push(
        `${summary.hash}: runtime peer provider ${detail.providerLocator} 重复`
      );
      continue;
    }
    seenProviders.add(detail.providerLocator);
    knownExceptions.push(summary.hash);
    acceptedProviders.add(detail.providerLocator);
  }
  for (const provider of REQUIRED_PROVIDERS) {
    if (!acceptedProviders.has(provider)) {
      errors.push(`缺少 ${provider} 的 RNRC 5/RNGH 3 审计项`);
    }
  }
  return { knownExceptions, errors };
}

function runYarn(args) {
  const yarn = path.resolve(__dirname, '../.yarn/releases/yarn-4.11.0.cjs');
  try {
    return execFileSync(process.execPath, [yarn, ...args], {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
    });
  } catch (error) {
    // `yarn explain peer-requirements` 存在失败项时会以非零码退出,但正文仍在 stdout。
    // 只有真的没拿到正文才向上抛。
    if (typeof error.stdout === 'string' && error.stdout.length > 0) {
      return error.stdout;
    }
    throw error;
  }
}

function main() {
  const rootManifest = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8')
  );
  const exampleManifest = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../example/package.json'), 'utf8')
  );
  const websiteManifest = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../website/package.json'), 'utf8')
  );
  const auditedPackages = deriveAuditedRuntimePackages(
    rootManifest,
    exampleManifest,
    websiteManifest
  );
  const summaries = parseRequirementList(
    runYarn(['explain', 'peer-requirements'])
  );
  const runtimeSummaries = summaries.filter((item) =>
    isAuditedRuntimeFailure(item, auditedPackages)
  );
  const details = new Map(
    runtimeSummaries.map((item) => [
      item.hash,
      parseRequirementDetail(
        item.hash,
        runYarn(['explain', 'peer-requirements', item.hash])
      ),
    ])
  );
  const result = auditRuntimePeers(summaries, details, auditedPackages);
  if (result.errors.length > 0) {
    throw new Error(result.errors.join('\n'));
  }
  for (const hash of result.knownExceptions) {
    console.log(
      `KNOWN_EXCEPTION ${hash}: react-native-reanimated-carousel@5.0.0 requests RNGH ${KNOWN_RANGE}; provider is validated RNGH 3.x`
    );
  }
}

module.exports = {
  auditRuntimePeers,
  deriveAuditedRuntimePackages,
  parseRequirementDetail,
  parseRequirementList,
};

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`[check-runtime-peers] ${error.message}`);
    process.exitCode = 1;
  }
}
