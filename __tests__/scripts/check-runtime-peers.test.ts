import { describe, expect, test } from '@jest/globals';
import {
  auditRuntimePeers as auditRuntimePeersWithSet,
  deriveAuditedRuntimePackages,
  parseRequirementDetail,
  parseRequirementList,
} from '../../scripts/check-runtime-peers';

const TEST_AUDITED_RUNTIME_PACKAGES = new Set([
  'react',
  'react-native-gesture-handler',
  'react-native-reanimated-carousel',
  'react-native-reanimated',
  'react-native-worklets',
  '@mdx-js/react',
]);
const auditRuntimePeers = (
  summaries: Parameters<typeof auditRuntimePeersWithSet>[0],
  details: Parameters<typeof auditRuntimePeersWithSet>[1],
  auditedPackages: Parameters<
    typeof auditRuntimePeersWithSet
  >[2] = TEST_AUDITED_RUNTIME_PACKAGES
) => auditRuntimePeersWithSet(summaries, details, auditedPackages);

const LIST = [
  'pc850d5 → ✘ @unif/react-native-design@workspace:. provides react-native-gesture-handler@npm:3.1.0',
  'pexample → ✘ @unif/react-native-design-example@workspace:example provides react-native-gesture-handler@npm:3.1.0',
  'pwebsite → ✘ @unif/react-native-design-website@workspace:website provides react-native-gesture-handler@npm:3.1.0',
  'punrelated → ✘ @unif/react-native-design@workspace:. provides react@npm:19.2.3',
].join('\n');

const rootDetail = [
  'Package @unif/react-native-design@workspace:. is requested to provide react-native-gesture-handler by its descendants',
  '',
  '@unif/react-native-design@workspace:.',
  '├─ react-native-reanimated-carousel@npm:5.0.0 (via >=2.9.0 <3.0.0)',
  '└─ @unif/consumer@workspace:. (via >=3.0.0 <4.0.0)',
  '',
  '✘ Package @unif/react-native-design@workspace:. provides react-native-gesture-handler with version 3.1.0, which does not satisfy all requests.',
  '  The combined requested range is >=2.9.0 <3.0.0',
].join('\n');

const websiteDetail = rootDetail.replaceAll(
  '@unif/react-native-design@workspace:.',
  '@unif/react-native-design-website@workspace:website'
);
const exampleDetail = rootDetail.replaceAll(
  '@unif/react-native-design@workspace:.',
  '@unif/react-native-design-example@workspace:example'
);

const reactDetail = rootDetail
  .replaceAll('react-native-gesture-handler', 'react')
  .replaceAll('3.1.0', '19.2.3')
  .replaceAll('>=2.9.0 <3.0.0', '>=19.2.3 <20.0.0');

// Yarn 4.11 真实输出:请求方 locator 后面还挂着 `[hash]` 虚拟实例标记。
// 逐字复制自本仓 `yarn explain peer-requirements pc850d5 / p86ac4b`。
const REAL_LIST = [
  'p86ac4b → ✘ @unif/react-native-design-website@workspace:website provides react-native-gesture-handler@npm:3.1.0 [53762] to @gorhom/bottom-sheet@npm:5.2.14 [53762] and 2 other dependencies',
  'pexample → ✘ @unif/react-native-design-example@workspace:example provides react-native-gesture-handler@npm:3.1.0 [e1234] to react-native-reanimated-carousel@npm:5.0.0 [e1234]',
  'pc850d5 → ✘ @unif/react-native-design@workspace:. provides react-native-gesture-handler@npm:3.1.0 [c9356] to react-native-reanimated-carousel@npm:5.0.0 [c9356]',
].join('\n');

const REAL_ROOT_DETAIL = [
  'Package @unif/react-native-design@workspace:. is requested to provide react-native-gesture-handler by its descendants',
  '',
  '@unif/react-native-design@workspace:.',
  '└─ react-native-reanimated-carousel@npm:5.0.0 [c9356] (via >=2.9.0 <3.0.0)',
  '',
  '✘ Package @unif/react-native-design@workspace:. provides react-native-gesture-handler with version 3.1.0, which does not satisfy all requests.',
  '  The combined requested range is >=2.9.0 <3.0.0',
].join('\n');

const REAL_WEBSITE_DETAIL = [
  'Package @unif/react-native-design-website@workspace:website is requested to provide react-native-gesture-handler by its descendants',
  '',
  '@unif/react-native-design-website@workspace:website',
  '├─ @gorhom/bottom-sheet@npm:5.2.14 [53762] (via >=2.16.1)',
  '├─ @unif/react-native-design@workspace:. [53762] (via >=3.0.0 <4.0.0)',
  '└─ react-native-reanimated-carousel@npm:5.0.0 [53762] (via >=2.9.0 <3.0.0)',
  '',
  '✘ Package @unif/react-native-design-website@workspace:website provides react-native-gesture-handler with version 3.1.0, which does not satisfy all requests.',
  '  Unfortunately, the requested ranges have no overlap',
].join('\n');

const REAL_EXAMPLE_DETAIL = REAL_ROOT_DETAIL.replaceAll(
  '@unif/react-native-design@workspace:.',
  '@unif/react-native-design-example@workspace:example'
).replaceAll('[c9356]', '[e1234]');

// Yarn 4.11 binary 的 list/detail formatter 分别使用 contraction 与完整否定：
// list: "doesn't provide"；detail: "does not provide"。
const REAL_MISSING_LIST =
  "p0abc12 → ✘ @unif/react-native-design@workspace:. doesn't provide react-native-worklets to react-native-reanimated@npm:4.5.3 [c9356]";

const REAL_MISSING_DETAIL = [
  'Package @unif/react-native-design@workspace:. is requested to provide react-native-worklets by its descendants',
  '',
  '@unif/react-native-design@workspace:.',
  '└─ react-native-reanimated@npm:4.5.3 [c9356] (via >=0.11.0 <0.12.0)',
  '',
  '✘ Package @unif/react-native-design@workspace:. does not provide react-native-worklets.',
].join('\n');

const DOTTED_SCOPED_MISSING_DETAIL = REAL_MISSING_DETAIL.replaceAll(
  'react-native-worklets',
  '@scope/runtime.peer'
);

describe('parseRequirementList — yarn explain peer-requirements 列表', () => {
  test('只抽取失败(✘)行的 hash / provider / 包名 / 版本', () => {
    expect(parseRequirementList(LIST)).toEqual([
      {
        kind: 'provided-mismatch',
        hash: 'pc850d5',
        providerLocator: '@unif/react-native-design@workspace:.',
        packageName: 'react-native-gesture-handler',
        providerVersion: '3.1.0',
      },
      {
        kind: 'provided-mismatch',
        hash: 'pexample',
        providerLocator: '@unif/react-native-design-example@workspace:example',
        packageName: 'react-native-gesture-handler',
        providerVersion: '3.1.0',
      },
      {
        kind: 'provided-mismatch',
        hash: 'pwebsite',
        providerLocator: '@unif/react-native-design-website@workspace:website',
        packageName: 'react-native-gesture-handler',
        providerVersion: '3.1.0',
      },
      {
        kind: 'provided-mismatch',
        hash: 'punrelated',
        providerLocator: '@unif/react-native-design@workspace:.',
        packageName: 'react',
        providerVersion: '19.2.3',
      },
    ]);
  });

  test('忽略无关行,不产生伪条目', () => {
    expect(
      parseRequirementList('Some unrelated banner\n\n✔ all good\n')
    ).toEqual([]);
  });

  test("解析 Yarn 4.11 doesn't provide missing-provider 失败并保留身份", () => {
    expect(parseRequirementList(REAL_MISSING_LIST)).toEqual([
      {
        kind: 'missing-provider',
        hash: 'p0abc12',
        providerLocator: '@unif/react-native-design@workspace:.',
        packageName: 'react-native-worklets',
      },
    ]);
  });
});

describe('deriveAuditedRuntimePackages — 项目可控 runtime manifest', () => {
  test('合并 root public peer 与 example/website dependencies，忽略纯 devDependencies', () => {
    expect(
      [
        ...deriveAuditedRuntimePackages(
          {
            peerDependencies: {
              'react': '>=19.2.3 <20',
              'react-native-svg': '>=15',
            },
            devDependencies: { eslint: '^9.0.0' },
          },
          {
            dependencies: {
              'example-runtime-only': '1.0.0',
              'react': '19.2.3',
            },
            devDependencies: { jest: '^29.0.0' },
          },
          {
            dependencies: {
              'website-runtime-only': '1.0.0',
              'react-dom': '19.2.3',
            },
            devDependencies: { typescript: '^5.0.0' },
          }
        ),
      ].sort()
    ).toEqual([
      'example-runtime-only',
      'react',
      'react-dom',
      'react-native-svg',
      'website-runtime-only',
    ]);
  });
});

describe('parseRequirementDetail — 明细解析', () => {
  test('抽取 provider / 版本 / 全部请求方与 range', () => {
    expect(parseRequirementDetail('pc850d5', rootDetail)).toEqual({
      kind: 'provided-mismatch',
      hash: 'pc850d5',
      providerLocator: '@unif/react-native-design@workspace:.',
      packageName: 'react-native-gesture-handler',
      providerVersion: '3.1.0',
      requests: [
        {
          requester: 'react-native-reanimated-carousel@npm:5.0.0',
          range: '>=2.9.0 <3.0.0',
        },
        { requester: '@unif/consumer@workspace:.', range: '>=3.0.0 <4.0.0' },
      ],
    });
  });

  test('无法解析时抛错而不是静默产出空明细', () => {
    expect(() => parseRequirementDetail('pbroken', 'garbage')).toThrow(
      'pbroken'
    );
  });

  test('解析 Yarn 4.11 does not provide 明细与请求方', () => {
    expect(parseRequirementDetail('p0abc12', REAL_MISSING_DETAIL)).toEqual({
      kind: 'missing-provider',
      hash: 'p0abc12',
      providerLocator: '@unif/react-native-design@workspace:.',
      packageName: 'react-native-worklets',
      requests: [
        {
          requester: 'react-native-reanimated@npm:4.5.3',
          range: '>=0.11.0 <0.12.0',
        },
      ],
    });
  });

  test('missing-provider 明细完整保留 scoped 且含点的合法 package name', () => {
    expect(
      parseRequirementDetail('p0abc12', DOTTED_SCOPED_MISSING_DETAIL)
    ).toMatchObject({
      kind: 'missing-provider',
      packageName: '@scope/runtime.peer',
    });
  });
});

describe('auditRuntimePeers — 严格 allowlist', () => {
  test('只接受 root、example 与 website 的 RNRC 5.0.0/RNGH 3 三条已知例外', () => {
    const summaries = parseRequirementList(
      LIST.split('\n').slice(0, 3).join('\n')
    );
    const details = new Map([
      ['pc850d5', parseRequirementDetail('pc850d5', rootDetail)],
      ['pexample', parseRequirementDetail('pexample', exampleDetail)],
      ['pwebsite', parseRequirementDetail('pwebsite', websiteDetail)],
    ]);
    expect(auditRuntimePeers(summaries, details)).toEqual({
      knownExceptions: ['pc850d5', 'pexample', 'pwebsite'],
      errors: [],
    });
  });

  test.each([
    ['RNRC version 漂移', rootDetail.replace('5.0.0', '5.1.0')],
    ['RNRC range 漂移', rootDetail.replace('>=2.9.0 <3.0.0', '>=2.9.0 <4.0.0')],
    ['RNGH major 漂移', rootDetail.replaceAll('3.1.0', '4.0.0')],
  ])('%s 时失败', (_name, detailText) => {
    const summaries = parseRequirementList(LIST.split('\n')[0] ?? '');
    const details = new Map([
      ['pc850d5', parseRequirementDetail('pc850d5', detailText)],
    ]);
    const result = auditRuntimePeers(summaries, details);
    expect(result.errors).not.toHaveLength(0);
    // 漂移必须被拒绝为例外本身,而不是只靠「缺少其他 workspace 审计项」凑出 error。
    expect(result.knownExceptions).toHaveLength(0);
  });

  test('root public React peer failure 被拒绝，不能被 RNRC/RNGH allowlist 吞掉', () => {
    const summaries = parseRequirementList(LIST);
    const details = new Map([
      ['pc850d5', parseRequirementDetail('pc850d5', rootDetail)],
      ['pexample', parseRequirementDetail('pexample', exampleDetail)],
      ['pwebsite', parseRequirementDetail('pwebsite', websiteDetail)],
      ['punrelated', parseRequirementDetail('punrelated', reactDetail)],
    ]);
    const result = auditRuntimePeers(
      summaries,
      details,
      deriveAuditedRuntimePackages(
        {
          peerDependencies: {
            'react': '>=19.2.3 <20.0.0',
            'react-native-gesture-handler': '>=3.0.0 <4.0.0',
          },
        },
        { dependencies: {} },
        { dependencies: {} }
      )
    );
    expect(result.knownExceptions).toEqual(['pc850d5', 'pexample', 'pwebsite']);
    expect(result.errors.join('\n')).toContain('react@19.2.3');
  });

  test('audited runtime missing-provider 立即显式失败，不能进入 RNRC/RNGH 例外', () => {
    const summaries = [
      ...parseRequirementList(LIST.split('\n').slice(0, 3).join('\n')),
      {
        kind: 'missing-provider' as const,
        hash: 'p0abc12',
        providerLocator: '@unif/react-native-design@workspace:.',
        packageName: 'react-native-worklets',
      },
    ];
    const details = new Map([
      ['pc850d5', parseRequirementDetail('pc850d5', rootDetail)],
      ['pexample', parseRequirementDetail('pexample', exampleDetail)],
      ['pwebsite', parseRequirementDetail('pwebsite', websiteDetail)],
      [
        'p0abc12',
        {
          kind: 'missing-provider' as const,
          hash: 'p0abc12',
          providerLocator: '@unif/react-native-design@workspace:.',
          packageName: 'react-native-worklets',
          requests: [
            {
              requester: 'react-native-reanimated@npm:4.5.3',
              range: '>=0.11.0 <0.12.0',
            },
          ],
        },
      ],
    ]);
    const result = auditRuntimePeers(summaries, details);

    expect(result.knownExceptions).toEqual(['pc850d5', 'pexample', 'pwebsite']);
    expect(result.errors.join('\n')).toContain(
      'p0abc12: audited runtime peer missing provider'
    );
    expect(result.errors.join('\n')).toContain('react-native-worklets');
  });

  test('三个 repository workspace 的 audited missing-provider 均明确失败', () => {
    const missingSummaries = [
      {
        kind: 'missing-provider' as const,
        hash: 'pmissingroot',
        providerLocator: '@unif/react-native-design@workspace:.',
        packageName: 'react',
      },
      {
        kind: 'missing-provider' as const,
        hash: 'pmissingexample',
        providerLocator: '@unif/react-native-design-example@workspace:example',
        packageName: 'react-native-worklets',
      },
      {
        kind: 'missing-provider' as const,
        hash: 'pmissingwebsite',
        providerLocator: '@unif/react-native-design-website@workspace:website',
        packageName: 'react',
      },
    ];
    const summaries = [
      ...parseRequirementList(LIST.split('\n').slice(0, 3).join('\n')),
      ...missingSummaries,
    ];
    const details = new Map([
      ['pc850d5', parseRequirementDetail('pc850d5', rootDetail)],
      ['pexample', parseRequirementDetail('pexample', exampleDetail)],
      ['pwebsite', parseRequirementDetail('pwebsite', websiteDetail)],
      ...missingSummaries.map(
        (summary): [string, ReturnType<typeof parseRequirementDetail>] => [
          summary.hash,
          { ...summary, requests: [{ requester: 'consumer', range: '*' }] },
        ]
      ),
    ]);

    const result = auditRuntimePeers(summaries, details);
    for (const summary of missingSummaries) {
      expect(result.errors.join('\n')).toContain(
        `${summary.hash}: audited runtime peer missing provider`
      );
    }
  });

  test('external Docusaurus missing-provider 即使包名 audited 也不要求明细或伪造 workspace failure', () => {
    const externalMissing = parseRequirementList(
      [
        "pdocusaurus → ✘ @docusaurus/bundler@npm:3.10.1 doesn't provide react to @docusaurus/core@npm:3.10.1",
        "pmdxplugin → ✘ @docusaurus/plugin-content-docs@npm:3.10.1 doesn't provide @mdx-js/react to @docusaurus/mdx-loader@npm:3.10.1",
      ].join('\n')
    );
    const summaries = [
      ...parseRequirementList(LIST.split('\n').slice(0, 3).join('\n')),
      ...externalMissing,
    ];
    const details = new Map([
      ['pc850d5', parseRequirementDetail('pc850d5', rootDetail)],
      ['pexample', parseRequirementDetail('pexample', exampleDetail)],
      ['pwebsite', parseRequirementDetail('pwebsite', websiteDetail)],
    ]);

    expect(auditRuntimePeers(summaries, details)).toEqual({
      knownExceptions: ['pc850d5', 'pexample', 'pwebsite'],
      errors: [],
    });
  });

  test('dev-only failure 不在派生集合时不要求明细也不产生错误', () => {
    const summaries = parseRequirementList(
      `${LIST.split('\n').slice(0, 3).join('\n')}\npdevonly → ✘ @unif/react-native-design@workspace:. provides eslint@npm:9.0.0`
    );
    const details = new Map([
      ['pc850d5', parseRequirementDetail('pc850d5', rootDetail)],
      ['pexample', parseRequirementDetail('pexample', exampleDetail)],
      ['pwebsite', parseRequirementDetail('pwebsite', websiteDetail)],
    ]);

    expect(auditRuntimePeers(summaries, details)).toEqual({
      knownExceptions: ['pc850d5', 'pexample', 'pwebsite'],
      errors: [],
    });
  });

  test('非 runtime missing-provider 会被解析，但不会伪造 audited failure 或要求明细', () => {
    const summaries = parseRequirementList(
      `${LIST.split('\n').slice(0, 3).join('\n')}\npdevmis → ✘ @unif/react-native-design@workspace:. doesn't provide eslint to @unif/dev-tool@npm:1.0.0`
    );
    expect(summaries.at(-1)).toMatchObject({
      kind: 'missing-provider',
      hash: 'pdevmis',
      packageName: 'eslint',
    });
    const details = new Map([
      ['pc850d5', parseRequirementDetail('pc850d5', rootDetail)],
      ['pexample', parseRequirementDetail('pexample', exampleDetail)],
      ['pwebsite', parseRequirementDetail('pwebsite', websiteDetail)],
    ]);

    expect(auditRuntimePeers(summaries, details)).toEqual({
      knownExceptions: ['pc850d5', 'pexample', 'pwebsite'],
      errors: [],
    });
  });

  test('缺少明细的 runtime 失败项直接报错', () => {
    const summaries = parseRequirementList(LIST);
    const result = auditRuntimePeers(summaries, new Map());
    expect(result.errors.join('\n')).toContain('pc850d5');
    expect(result.knownExceptions).toHaveLength(0);
  });

  test('root、example 与 website 任一缺失审计项都失败', () => {
    const summaries = parseRequirementList(LIST.split('\n')[0] ?? '');
    const details = new Map([
      ['pc850d5', parseRequirementDetail('pc850d5', rootDetail)],
    ]);
    const result = auditRuntimePeers(summaries, details);
    expect(result.knownExceptions).toEqual(['pc850d5']);
    expect(result.errors.join('\n')).toContain(
      '@unif/react-native-design-website@workspace:website'
    );
  });

  test('额外的第四 workspace provider 不得进入窄例外', () => {
    const fourthProvider = '@unif/runtime-fourth@workspace:runtime-fourth';
    const fourthDetail = rootDetail.replaceAll(
      '@unif/react-native-design@workspace:.',
      fourthProvider
    );
    const summaries = parseRequirementList(
      [
        LIST.split('\n')[0],
        LIST.split('\n')[1],
        LIST.split('\n')[2],
        'pfourth → ✘ @unif/runtime-fourth@workspace:runtime-fourth provides react-native-gesture-handler@npm:3.1.0',
      ].join('\n')
    );
    const details = new Map([
      ['pc850d5', parseRequirementDetail('pc850d5', rootDetail)],
      ['pexample', parseRequirementDetail('pexample', exampleDetail)],
      ['pwebsite', parseRequirementDetail('pwebsite', websiteDetail)],
      ['pfourth', parseRequirementDetail('pfourth', fourthDetail)],
    ]);

    const result = auditRuntimePeers(summaries, details);
    expect(result.errors.join('\n')).toContain(fourthProvider);
    expect(result.knownExceptions).toEqual(['pc850d5', 'pexample', 'pwebsite']);
  });

  test.each([
    [
      'kind',
      {
        ...parseRequirementDetail('pc850d5', rootDetail),
        kind: 'missing-provider' as const,
      },
    ],
    [
      'hash',
      {
        ...parseRequirementDetail('pc850d5', rootDetail),
        hash: 'pother',
      },
    ],
    [
      'provider',
      {
        ...parseRequirementDetail('pc850d5', rootDetail),
        providerLocator: '@unif/react-native-design-website@workspace:website',
      },
    ],
    [
      'package',
      {
        ...parseRequirementDetail('pc850d5', rootDetail),
        packageName: 'react-native-reanimated',
      },
    ],
    [
      'version',
      {
        ...parseRequirementDetail('pc850d5', rootDetail),
        providerVersion: '3.2.0',
      },
    ],
  ])('summary/detail 的 %s 身份不一致时失败', (_field, mismatchedDetail) => {
    const summaries = parseRequirementList(
      [LIST.split('\n')[0], LIST.split('\n')[2]].join('\n')
    );
    const details = new Map([
      ['pc850d5', mismatchedDetail],
      ['pwebsite', parseRequirementDetail('pwebsite', websiteDetail)],
    ]);

    const result = auditRuntimePeers(summaries, details);
    expect(result.errors.join('\n')).toContain('身份不一致');
    expect(result.knownExceptions).toEqual(['pwebsite']);
  });

  test('同一个 required provider 出现两次时失败', () => {
    const summaries = parseRequirementList(
      [
        LIST.split('\n')[0],
        'pduplicate → ✘ @unif/react-native-design@workspace:. provides react-native-gesture-handler@npm:3.1.0',
        LIST.split('\n')[2],
      ].join('\n')
    );
    const details = new Map([
      ['pc850d5', parseRequirementDetail('pc850d5', rootDetail)],
      ['pduplicate', parseRequirementDetail('pduplicate', rootDetail)],
      ['pwebsite', parseRequirementDetail('pwebsite', websiteDetail)],
    ]);

    const result = auditRuntimePeers(summaries, details);
    expect(result.errors.join('\n')).toContain('重复');
    expect(result.knownExceptions).toEqual(['pc850d5', 'pwebsite']);
  });

  test('真实 Yarn 4.11 输出(requester 带 [hash] 虚拟实例后缀)被接受', () => {
    const summaries = parseRequirementList(REAL_LIST);
    expect(summaries.map((item) => item.hash)).toEqual([
      'p86ac4b',
      'pexample',
      'pc850d5',
    ]);
    const details = new Map([
      ['p86ac4b', parseRequirementDetail('p86ac4b', REAL_WEBSITE_DETAIL)],
      ['pexample', parseRequirementDetail('pexample', REAL_EXAMPLE_DETAIL)],
      ['pc850d5', parseRequirementDetail('pc850d5', REAL_ROOT_DETAIL)],
    ]);
    expect(auditRuntimePeers(summaries, details)).toEqual({
      knownExceptions: ['p86ac4b', 'pexample', 'pc850d5'],
      errors: [],
    });
  });

  test('虚拟实例后缀不会掩盖真实的 RNRC 版本漂移', () => {
    const summaries = parseRequirementList(REAL_LIST.split('\n')[2] ?? '');
    const details = new Map([
      [
        'pc850d5',
        parseRequirementDetail(
          'pc850d5',
          REAL_ROOT_DETAIL.replace('carousel@npm:5.0.0', 'carousel@npm:5.1.0')
        ),
      ],
    ]);
    expect(auditRuntimePeers(summaries, details).knownExceptions).toHaveLength(
      0
    );
  });

  test('额外请求方 range 与已装版本不兼容时失败', () => {
    const summaries = parseRequirementList(LIST.split('\n')[0] ?? '');
    const details = new Map([
      [
        'pc850d5',
        parseRequirementDetail(
          'pc850d5',
          rootDetail.replace('(via >=3.0.0 <4.0.0)', '(via >=2.0.0 <3.0.0)')
        ),
      ],
    ]);
    expect(auditRuntimePeers(summaries, details).knownExceptions).toHaveLength(
      0
    );
  });
});
