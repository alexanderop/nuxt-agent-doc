import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import pluginOxlint from 'eslint-plugin-oxlint'

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: {
      commaDangle: 'never',
      braceStyle: '1tbs'
    }
  }
})
  .overrideRules({
    'import/first': 'off',
    'import/order': 'off',
    'vue/multi-word-component-names': 'off',
    'vue/max-attributes-per-line': ['error', { singleline: 5 }]
  })
  .append(
    {
      name: 'app/style',
      files: ['**/*.{ts,vue}'],
      rules: {
        'no-restricted-syntax': [
          'error',
          {
            selector: 'TSEnumDeclaration',
            message: 'Use literal unions or `as const` objects instead of enums.'
          },
          {
            selector: 'IfStatement > IfStatement.alternate',
            message: 'Avoid `else if`. Prefer early returns.'
          },
          {
            selector: 'IfStatement > :not(IfStatement).alternate',
            message: 'Avoid `else`. Prefer early returns.'
          }
        ]
      }
    },
    {
      name: 'app/vue',
      files: ['**/*.vue'],
      rules: {
        'vue/component-name-in-template-casing': ['error', 'PascalCase', {
          registeredComponentsOnly: false
        }],
        'vue/prop-name-casing': ['error', 'camelCase'],
        'vue/attribute-hyphenation': ['error', 'always'],
        'vue/custom-event-name-casing': ['error', 'kebab-case'],
        'vue/no-unused-properties': ['error', {
          groups: ['props', 'data', 'computed', 'methods']
        }],
        'vue/no-unused-refs': 'error',
        'vue/prefer-use-template-ref': 'error',
        'vue/max-template-depth': ['error', { maxDepth: 8 }],
        'vue/match-component-file-name': ['error', {
          extensions: ['vue'],
          shouldMatchCase: true
        }]
      }
    },
    ...pluginOxlint.buildFromOxlintConfigFile('./.oxlintrc.json')
  )
