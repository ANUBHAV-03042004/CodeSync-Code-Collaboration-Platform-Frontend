/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',

  // ── CRITICAL FIX ─────────────────────────────────────────────────────────────
  // zone.js 0.14.x patchJest() reads describe/it/test globals at patch time.
  // setupFiles  → runs BEFORE Jest injects globals → describe.each is undefined → TypeError crash
  // setupFilesAfterEnv → runs AFTER Jest injects globals → describe/it/test exist → works
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],

  testEnvironment: 'jsdom',

  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@env/(.*)$': '<rootDir>/src/environments/$1'
  },

  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$'
      }
    ]
  },

  // Include Angular + zone.js ESM packages in transform
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|@angular|rxjs|zone\\.js)'
  ],

  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.routes.ts',
    '!src/main.ts'
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  testMatch: [
    '**/__tests__/**/*.spec.ts',
    '**/services/__tests__/**/*.spec.ts',
    '**/core/__tests__/**/*.spec.ts'
  ],

  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs']
};
