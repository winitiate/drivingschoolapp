import js           from '@eslint/js';
import globals      from 'globals';
import reactHooks   from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint     from 'typescript-eslint';
import unicorn      from 'eslint-plugin-unicorn';

/* ──────────────────────────────────────────────────────────────────
   0.  Shared pieces
   ────────────────────────────────────────────────────────────────── */
const reactHookRules = {
  ...reactHooks.configs.recommended.rules,
  'react-refresh/only-export-components': [
    'warn',
    { allowConstantExport: true },
  ],
};

const filenameCaseRule = [
  'error',
  {
    cases: { camelCase: true, pascalCase: true },
  },
];

/* ──────────────────────────────────────────────────────────────────
   1.  Front-end (src/) – the strict rules
   ────────────────────────────────────────────────────────────────── */
const frontEndConfig = {
  files: ['**/*.{ts,tsx}'],
  ignores: ['functions-*'],           // handled separately below
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
  plugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
    unicorn,
  },
  rules: {
    ...reactHookRules,
    'unicorn/filename-case': filenameCaseRule,
  },
};

/* ──────────────────────────────────────────────────────────────────
   2.  Cloud Functions + tests – stripped-down rules
   ────────────────────────────────────────────────────────────────── */
const functionsAndTests = {
  // any depth under functions-appointments, functions-users, etc.,
  // PLUS Jest / Vitest style __tests__ folders
  files: [
    'functions-*/**/*.{ts,tsx}',
    '**/__tests__/**/*.{ts,tsx}',
    'scripts/**/*.{ts,tsx}',
  ],

  // *** No 'extends' here – that prevents the strict presets from loading ***
  languageOptions: {
    ecmaVersion: 2020,
    globals: { ...globals.node, ...globals.es2021 },
  },

  plugins: { unicorn },

  rules: {
    // we just want basic syntax / formatting checks
    '@typescript-eslint/no-explicit-any'   : 'off',
    '@typescript-eslint/no-unused-vars'    : 'off',
    '@typescript-eslint/ban-ts-comment'    : 'off',
    '@typescript-eslint/no-require-imports': 'off',
    'unicorn/filename-case'                : 'off',
  },
};

/* ──────────────────────────────────────────────────────────────────
   3.  Export the merged config
   ────────────────────────────────────────────────────────────────── */
export default tseslint.config(
  { ignores: ['dist'] },  // generated output
  frontEndConfig,
  functionsAndTests,
);