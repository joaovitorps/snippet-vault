import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  { ignores: ['**/dist/**', '**/.turbo/**', '**/routeTree.gen.ts'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  reactHooks.configs.recommended,
  {
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
)
