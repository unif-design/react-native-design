import { describe, expect, test } from '@jest/globals';
import {
  auditRuntimePeers,
  parseRequirementDetail,
  parseRequirementList,
} from '../../scripts/check-runtime-peers';

const LIST = [
  'pc850d5 → ✘ @unif/react-native-design@workspace:. provides react-native-gesture-handler@npm:3.1.0',
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

// Yarn 4.11 真实输出:请求方 locator 后面还挂着 `[hash]` 虚拟实例标记。
// 逐字复制自本仓 `yarn explain peer-requirements pc850d5 / p86ac4b`。
const REAL_LIST = [
  'p86ac4b → ✘ @unif/react-native-design-website@workspace:website provides react-native-gesture-handler@npm:3.1.0 [53762] to @gorhom/bottom-sheet@npm:5.2.14 [53762] and 2 other dependencies',
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

describe('parseRequirementList — yarn explain peer-requirements 列表', () => {
  test('只抽取失败(✘)行的 hash / provider / 包名 / 版本', () => {
    expect(parseRequirementList(LIST)).toEqual([
      {
        hash: 'pc850d5',
        providerLocator: '@unif/react-native-design@workspace:.',
        packageName: 'react-native-gesture-handler',
        providerVersion: '3.1.0',
      },
      {
        hash: 'pwebsite',
        providerLocator: '@unif/react-native-design-website@workspace:website',
        packageName: 'react-native-gesture-handler',
        providerVersion: '3.1.0',
      },
      {
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
});

describe('parseRequirementDetail — 明细解析', () => {
  test('抽取 provider / 版本 / 全部请求方与 range', () => {
    expect(parseRequirementDetail('pc850d5', rootDetail)).toEqual({
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
});

describe('auditRuntimePeers — 严格 allowlist', () => {
  test('只接受 root 与 website 的 RNRC 5.0.0/RNGH 3 已知例外', () => {
    const summaries = parseRequirementList(LIST);
    const details = new Map([
      ['pc850d5', parseRequirementDetail('pc850d5', rootDetail)],
      ['pwebsite', parseRequirementDetail('pwebsite', websiteDetail)],
    ]);
    expect(auditRuntimePeers(summaries, details)).toEqual({
      knownExceptions: ['pc850d5', 'pwebsite'],
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
    // 漂移必须被拒绝为例外本身,而不是只靠「缺少 website 审计项」凑出 error。
    expect(result.knownExceptions).toHaveLength(0);
  });

  test('非 runtime 包的失败项被忽略,不进 knownExceptions', () => {
    const summaries = parseRequirementList(LIST);
    const details = new Map([
      ['pc850d5', parseRequirementDetail('pc850d5', rootDetail)],
      ['pwebsite', parseRequirementDetail('pwebsite', websiteDetail)],
      ['punrelated', parseRequirementDetail('punrelated', rootDetail)],
    ]);
    expect(auditRuntimePeers(summaries, details).knownExceptions).toEqual([
      'pc850d5',
      'pwebsite',
    ]);
  });

  test('缺少明细的 runtime 失败项直接报错', () => {
    const summaries = parseRequirementList(LIST);
    const result = auditRuntimePeers(summaries, new Map());
    expect(result.errors.join('\n')).toContain('pc850d5');
    expect(result.knownExceptions).toHaveLength(0);
  });

  test('root 与 website 任一缺失审计项都失败', () => {
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

  test('额外的第三 workspace provider 不得进入窄例外', () => {
    const thirdProvider = '@unif/runtime-third@workspace:runtime-third';
    const thirdDetail = rootDetail.replaceAll(
      '@unif/react-native-design@workspace:.',
      thirdProvider
    );
    const summaries = parseRequirementList(
      [
        LIST.split('\n')[0],
        LIST.split('\n')[1],
        'pthird → ✘ @unif/runtime-third@workspace:runtime-third provides react-native-gesture-handler@npm:3.1.0',
      ].join('\n')
    );
    const details = new Map([
      ['pc850d5', parseRequirementDetail('pc850d5', rootDetail)],
      ['pwebsite', parseRequirementDetail('pwebsite', websiteDetail)],
      ['pthird', parseRequirementDetail('pthird', thirdDetail)],
    ]);

    const result = auditRuntimePeers(summaries, details);
    expect(result.errors.join('\n')).toContain(thirdProvider);
    expect(result.knownExceptions).toEqual(['pc850d5', 'pwebsite']);
  });

  test.each([
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
      [LIST.split('\n')[0], LIST.split('\n')[1]].join('\n')
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
        LIST.split('\n')[1],
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
    expect(summaries.map((item) => item.hash)).toEqual(['p86ac4b', 'pc850d5']);
    const details = new Map([
      ['p86ac4b', parseRequirementDetail('p86ac4b', REAL_WEBSITE_DETAIL)],
      ['pc850d5', parseRequirementDetail('pc850d5', REAL_ROOT_DETAIL)],
    ]);
    expect(auditRuntimePeers(summaries, details)).toEqual({
      knownExceptions: ['p86ac4b', 'pc850d5'],
      errors: [],
    });
  });

  test('虚拟实例后缀不会掩盖真实的 RNRC 版本漂移', () => {
    const summaries = parseRequirementList(REAL_LIST.split('\n')[1] ?? '');
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
