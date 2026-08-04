import {
  createShowcaseStateCoverage,
  ShowcaseStateProofError,
} from './helpers/showcaseStateCoverage';

test('state proof 只在内联 callback 实际产生 Jest assertion 后原子记账', () => {
  const coverage = createShowcaseStateCoverage('Tag');
  let executed = false;

  coverage.prove('tag.variants', () => {
    executed = true;
    expect(['primary', 'success']).toContain('primary');
  });
  coverage.prove('tag.sizes', () => {
    expect(['md', 'lg']).toEqual(['md', 'lg']);
  });

  expect(executed).toBe(true);
  coverage.expectComplete();
});

test('state proof 拒绝空 callback 且不会提前完成 coverage', () => {
  const coverage = createShowcaseStateCoverage('Tag');

  expect(() => coverage.prove('tag.variants', () => {})).toThrow(
    /至少产生一个 Jest assertion/u
  );
  expect(() => coverage.expectComplete()).toThrow();
});

test('state proof helper 仅声明未调用时不能完成 coverage', () => {
  const coverage = createShowcaseStateCoverage('Tag');
  const deadProof = () =>
    coverage.prove('tag.variants', 'tag.sizes', () => {
      expect(true).toBe(true);
    });

  expect(deadProof).toEqual(expect.any(Function));
  expect(() => coverage.expectComplete()).toThrow();
});

test('state proof callback 抛错或返回 thenable 时不提交任何 ID', () => {
  const thrownCoverage = createShowcaseStateCoverage('Tag');
  expect(() =>
    thrownCoverage.prove('tag.variants', () => {
      expect('mounted').toBe('mounted');
      throw new Error('proof failed');
    })
  ).toThrow('proof failed');
  expect(() => thrownCoverage.expectComplete()).toThrow();

  const asyncCoverage = createShowcaseStateCoverage('Tag');
  expect(() =>
    asyncCoverage.prove('tag.variants', async () => {
      expect('mounted').toBe('mounted');
    })
  ).toThrow(/同步 callback/u);
  expect(() => asyncCoverage.expectComplete()).toThrow();
});

test('state proof callback 失败时暴露通用 typed context 并保留 cause', () => {
  const coverage = createShowcaseStateCoverage('Tag');
  const cause = new Error('specimen missing');

  expect(() =>
    coverage.prove('tag.variants', 'tag.sizes', () => {
      throw cause;
    })
  ).toThrow(
    expect.objectContaining({
      name: 'ShowcaseStateProofError',
      code: 'SHOWCASE_STATE_PROOF_FAILED',
      component: 'Tag',
      stateIds: ['tag.variants', 'tag.sizes'],
      cause,
    }) satisfies Partial<ShowcaseStateProofError>
  );
  expect(() => coverage.expectComplete()).toThrow();
});

test('state proof 在 callback 前拒绝越界与整组重复 ID', () => {
  const coverage = createShowcaseStateCoverage('Tag');
  let executed = false;
  const proof = () => {
    executed = true;
    expect('tag').toBe('tag');
  };

  expect(() => coverage.prove('button.loading' as never, proof)).toThrow(
    /不在 Tag state contract/u
  );
  expect(() => coverage.prove('tag.variants', 'tag.variants', proof)).toThrow(
    /重复/u
  );
  expect(executed).toBe(false);
});

test('state proof 拒绝跨调用重复，并由 expectComplete 精确拒绝漏项', () => {
  const coverage = createShowcaseStateCoverage('Tag');
  coverage.prove('tag.variants', () => {
    expect('primary').toMatch(/primary/u);
  });

  let duplicateExecuted = false;
  expect(() =>
    coverage.prove('tag.variants', () => {
      duplicateExecuted = true;
      expect('primary').toBe('primary');
    })
  ).toThrow(/重复/u);
  expect(duplicateExecuted).toBe(false);
  expect(() => coverage.expectComplete()).toThrow();
});
