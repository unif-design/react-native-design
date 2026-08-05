import { requiredRuntimeApis } from '../../catalog/componentCatalog';

type RequiredRuntimeApi = (typeof requiredRuntimeApis)[number];

const runtimeProofIdsByOwner = {
  app: ['ThemeProvider', 'normalizeFontScale'],
  foundation: [
    'useTheme',
    'useColors',
    'useShadow',
    'useFontScale',
    'useThemedStyles',
    'usePrefersReducedMotion',
    'scaleFontMetric',
    'r',
    'rf',
    'lightColors',
    'darkColors',
    'avatarGradient',
    'BRAND_ORANGE',
    'warmOrangePalette',
    'lightShadow',
    'darkShadow',
    'fontMono',
    'type',
    'fw',
    'space',
    'radius',
    'avatar',
    'icon',
    'control',
    'dim',
    'fixed',
    'motion',
    'pressedOpacity',
    'blur',
    'ICONS',
    'ICON_NAMES',
    'childTestID',
    'createLogger',
    'setLogLevel',
    'getLogLevel',
    'addTransport',
    'removeTransport',
    'consoleTransport',
  ],
  feedback: ['confirm', 'toast', 'usePulse'],
  business: ['useSvgId'],
} as const satisfies Readonly<Record<string, readonly RequiredRuntimeApi[]>>;

type RuntimeProofOwner = keyof typeof runtimeProofIdsByOwner;
type OwnerRuntimeApi<Owner extends RuntimeProofOwner> =
  (typeof runtimeProofIdsByOwner)[Owner][number];
type RuntimeProofArgs<Owner extends RuntimeProofOwner> = [
  ...runtimeIds: OwnerRuntimeApi<Owner>[],
  proof: () => void,
];

function validateRuntimeProofContract(): void {
  const configured = Object.values(runtimeProofIdsByOwner).flat();
  const duplicates = configured.filter(
    (runtimeId, index) => configured.indexOf(runtimeId) !== index
  );
  const expected = [...requiredRuntimeApis].sort();
  const actual = [...configured].sort();
  if (
    duplicates.length > 0 ||
    JSON.stringify(actual) !== JSON.stringify(expected)
  ) {
    throw new Error(
      `runtime proof owner contract 漂移；重复=${duplicates.join(',') || '无'} expected=${expected.join(',')} actual=${actual.join(',')}`
    );
  }
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    (typeof value === 'object' || typeof value === 'function') &&
    value !== null &&
    'then' in value &&
    typeof value.then === 'function'
  );
}

validateRuntimeProofContract();

export function createShowcaseRuntimeCoverage<Owner extends RuntimeProofOwner>(
  owner: Owner
) {
  const required: readonly RequiredRuntimeApi[] = runtimeProofIdsByOwner[owner];
  const proved = new Set<RequiredRuntimeApi>();

  return {
    prove(...args: RuntimeProofArgs<Owner>): void {
      const proofArgs: Array<OwnerRuntimeApi<Owner> | (() => void)> = [...args];
      const proof = proofArgs.pop();
      const runtimeIds = proofArgs.filter(
        (value): value is OwnerRuntimeApi<Owner> => typeof value === 'string'
      );
      if (
        runtimeIds.length === 0 ||
        runtimeIds.length !== proofArgs.length ||
        typeof proof !== 'function'
      ) {
        throw new Error(`${owner} runtime proof 需要 ID 与同步 callback`);
      }

      const pending = new Set<OwnerRuntimeApi<Owner>>();
      for (const runtimeId of runtimeIds) {
        if (!required.includes(runtimeId)) {
          throw new Error(
            `${runtimeId} 不在 ${owner} runtime proof contract 中`
          );
        }
        if (proved.has(runtimeId) || pending.has(runtimeId)) {
          throw new Error(
            `${runtimeId} 在 ${owner} runtime proof 中被重复证明`
          );
        }
        pending.add(runtimeId);
      }

      const assertionsBefore = expect.getState().assertionCalls;
      const result: unknown = proof();
      if (isThenable(result)) {
        throw new Error(`${owner} runtime proof 只接受同步 callback`);
      }
      if (expect.getState().assertionCalls <= assertionsBefore) {
        throw new Error(
          `${owner} runtime proof callback 必须至少产生一个 Jest assertion`
        );
      }
      for (const runtimeId of pending) proved.add(runtimeId);
    },
    expectComplete(): void {
      expect([...proved].sort()).toEqual([...required].sort());
    },
  };
}
