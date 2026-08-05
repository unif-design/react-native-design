import { createShowcaseRuntimeCoverage } from './helpers/showcaseRuntimeCoverage';

test('runtime proof 只在同步 callback 产生 Jest assertion 后完成 owner exact set', () => {
  const coverage = createShowcaseRuntimeCoverage('business');

  coverage.prove('useSvgId', () => {
    expect(['business-wash', 'business-halo']).toHaveLength(2);
  });

  coverage.expectComplete();
});

test('runtime proof 拒绝空 callback、未调用 helper 与漏项', () => {
  const emptyCoverage = createShowcaseRuntimeCoverage('business');
  expect(() => emptyCoverage.prove('useSvgId', () => {})).toThrow(
    /至少产生一个 Jest assertion/u
  );
  expect(() => emptyCoverage.expectComplete()).toThrow();

  const deadCoverage = createShowcaseRuntimeCoverage('business');
  const deadProof = () =>
    deadCoverage.prove('useSvgId', () => {
      expect('id').toBe('id');
    });
  expect(deadProof).toEqual(expect.any(Function));
  expect(() => deadCoverage.expectComplete()).toThrow();
});

test('runtime proof callback 抛错或返回 thenable 时不提交 ID', () => {
  const thrownCoverage = createShowcaseRuntimeCoverage('business');
  expect(() =>
    thrownCoverage.prove('useSvgId', () => {
      expect('id').toBe('id');
      throw new Error('runtime proof failed');
    })
  ).toThrow('runtime proof failed');
  expect(() => thrownCoverage.expectComplete()).toThrow();

  const asyncCoverage = createShowcaseRuntimeCoverage('business');
  expect(() =>
    asyncCoverage.prove('useSvgId', async () => {
      expect('id').toBe('id');
    })
  ).toThrow(/同步 callback/u);
  expect(() => asyncCoverage.expectComplete()).toThrow();
});

test('runtime proof 在 callback 前拒绝越界与跨调用重复 ID', () => {
  const coverage = createShowcaseRuntimeCoverage('business');
  let invalidExecuted = false;
  expect(() =>
    coverage.prove('toast' as never, () => {
      invalidExecuted = true;
      expect('toast').toBe('toast');
    })
  ).toThrow(/不在 business runtime proof contract/u);
  expect(invalidExecuted).toBe(false);

  coverage.prove('useSvgId', () => {
    expect('business-id').toMatch(/business/u);
  });
  let duplicateExecuted = false;
  expect(() =>
    coverage.prove('useSvgId', () => {
      duplicateExecuted = true;
      expect('id').toBe('id');
    })
  ).toThrow(/重复/u);
  expect(duplicateExecuted).toBe(false);
  coverage.expectComplete();
});
