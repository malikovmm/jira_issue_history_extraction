module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: ['next', 'eslint:recommended'],
  plugins: ['prettier'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-undef': 'off',
    '@next/next/no-img-element': 'off',
    '@next/next/no-html-link-for-pages': ['warn', 'frontend/src/pages'],
    'prettier/prettier': [
      'error',
      {},
      {
        usePrettierrc: true
      }
    ],
    '@typescript-eslint/no-namespace': [2, { allowDeclarations: true }],
    '@typescript-eslint/no-empty-interface': 'off'
  },
  ignorePatterns: ['**/.next/*', '**/.mdx/*', '**/.serverless/*', 'out/*'],
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      extends: [
        'next',
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended'
      ],

      rules: {
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'no-undef': 'off',
        '@next/next/no-img-element': 'off',
        '@next/next/no-html-link-for-pages': ['warn', 'frontend/src/pages'],
        'prettier/prettier': [
          'error',
          {},
          {
            usePrettierrc: true
          }
        ],
        '@typescript-eslint/no-namespace': [2, { allowDeclarations: true }],
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off'
      }
    }
  ]
};
