import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

// Database-specific Jest configuration for CI/CD pipeline
const dbJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.mjs', '<rootDir>/jest.db.setup.mjs'],
  testEnvironment: 'node', // Node environment for database tests
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/prisma/**/*.test.[jt]s?(x)',
    '**/__tests__/database/**/*.test.[jt]s?(x)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/.next/',
  ],
  collectCoverageFrom: [
    'lib/prisma.ts',
    'prisma/seed.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: '<rootDir>/coverage-db',
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  // ESM Support
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
          decorators: true,
        },
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$))',
  ],
  // Database test configuration
  testTimeout: 30000, // 30 seconds for database operations
  maxWorkers: 1, // Run database tests sequentially to avoid conflicts
  globalSetup: '<rootDir>/jest.db.globalSetup.mjs',
  globalTeardown: '<rootDir>/jest.db.globalTeardown.mjs',
}

export default createJestConfig(dbJestConfig)