/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',
  setupFiles: ['<rootDir>/setup-jest.ts'],
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
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
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
