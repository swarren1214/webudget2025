// server/jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFiles: ['<rootDir>/jest.setup.js'],
    clearMocks: true,
    coverageDirectory: 'coverage',
};