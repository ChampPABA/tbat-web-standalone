import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

// Integration test configuration without Prisma mocking
const integrationJestConfig = {
  testEnvironment: 'node', // Use node environment for integration tests
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*integration*.test.[jt]s?(x)',
    '**/__tests__/models/*.test.[jt]s?(x)', // Include security-tables tests
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/.next/',
  ],
  // Skip setup file that mocks Prisma
  setupFilesAfterEnv: [],
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest', // Use ts-jest instead of SWC
  },
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
}

export default createJestConfig(integrationJestConfig)