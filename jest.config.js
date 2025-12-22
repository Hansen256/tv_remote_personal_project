const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|scss|sass|less)$': '<rootDir>/tests/__mocks__/styleMock.js'
  },
  testMatch: ['**/__tests__/**/*.spec.js'],
  // Measure coverage only for production code, excluding test directories
  collectCoverageFrom: ['js/**/*.js', '!js/**/__tests__/**'],
  // Disable Jest transforms intentionally: this project uses native ES modules and
  // does not require Babel/ts-jest or other code transformations.
  transform: {}
};

export default config;
