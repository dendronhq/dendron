const commonConfig = {
  preset: "ts-jest",
  clearMocks: true,
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.json",
      diagnostics: false,
    },
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  modulePathIgnorePatterns: ["lib", "build", "docs"],
  notify: true,
  notifyMode: "always",
  snapshotSerializers: ["jest-serializer-path"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["utils.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
};

module.exports = {
  coverageDirectory: "coverage",
  coverageReporters: ["text", "clover"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  ...commonConfig,
  projects: [
    {
      preset: "ts-jest",
      displayName: "non-plugin-tests",
      testMatch: [
        "<rootDir>/packages/engine-test-utils/**/?(*.)+(spec|test).[jt]s?(x)",
      ],
      ...commonConfig,
    },
  ],
};
