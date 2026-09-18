import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    extends: fixupConfigRules(compat.extends('@react-native', 'prettier')),
    plugins: { prettier },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  },
  {
    // 与 .gitignore 的预览生成目录一致，避免对打包后的第三方代码重复 lint。
    ignores: ['node_modules/', 'lib/', 'website/', 'ds-bundle/'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '../*/styles',
                '../*/styles.*',
                '@/*',
                '@unif/react-native-chat',
                '**/portal/**',
              ],
              message:
                'Design 不读取其他组件的私有样式或应用业务入口；实际共享计算放在所属组件族内部单元。',
            },
          ],
        },
      ],
    },
  },
]);
