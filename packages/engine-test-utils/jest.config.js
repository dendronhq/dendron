const jestConfig = require("../../jest.config");
const TEST_FILES_REGEX = '.*engine-test-utils.*spec\\.ts$';

module.exports = {
  ...jestConfig,
  rootDir: "./../",
  testRegex: TEST_FILES_REGEX,
  collectCoverage: true,
  testEnvironment: "jest-environment-jsdom-sixteen",
  collectCoverageFrom: [
    // Include typescript source files 
    "**/src/**/*.ts",

    // Exclude tests from code coverage metrics.
    "!**/*.test.ts",

    // Exclude definitions from code coverage metrics.
    "!**/*.d.ts",
    // Exclude snapshots from code coverage tests:
    "!**/__snapshots__/**",
  ],
};
