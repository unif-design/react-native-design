import { describe, expect, test } from '@jest/globals';
import { parseTomlConfig } from '../../scripts/check-config';

describe('parseTomlConfig', () => {
  test('解析含中文和双引号的 TOML literal string', () => {
    const result = parseTomlConfig(
      `[pr_code_suggestions]\nextra_instructions = '不要给"考虑重构"这种空泛建议。'\n`,
      '.pr_agent.toml'
    );

    expect(result).toEqual({
      pr_code_suggestions: {
        extra_instructions: '不要给"考虑重构"这种空泛建议。',
      },
    });
  });

  test('解析失败时错误同时包含文件名和 parser 原因', () => {
    expect(() =>
      parseTomlConfig(
        '[x]\nvalue = "不要给"考虑重构"这种空泛建议"\n',
        'broken.toml'
      )
    ).toThrow(/broken\.toml: .+/u);
  });
});
