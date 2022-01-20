module.exports = {
  preset: "ts-jest",
  clearMocks: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "clover", "html"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.json",
      diagnostics: false,
    },
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  modulePathIgnorePatterns: ["lib"],
  notify: true,
  notifyMode: "always",
  snapshotSerializers: ["jest-serializer-path"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["utils.ts"],
  //roots: ["<rootDir>/packages"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  //setupTestFrameworkScriptFile: "<rootDir>src/setupTests.ts",
  //snapshotSerializers: ["enzyme-to-json/serializer"],
};
