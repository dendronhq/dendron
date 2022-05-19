const commonConfig = {
  // preset: "ts-jest",
  clearMocks: true,
  // globals: {
  //   "ts-jest": {
  //     tsconfig: "tsconfig.json",
  //     diagnostics: false,
  //     useESM: true,
  //   },
  // },
  moduleFileExtensions: ["ts", "tsx", "js", "json"],
  modulePathIgnorePatterns: ["lib", "build", "docs"],
  notify: true,
  notifyMode: "always",
  snapshotSerializers: ["jest-serializer-path"],
  testEnvironment: "node",
  testPathIgnorePatterns: ["utils.ts"],
  //   /Users/kevinlin/code/dendron/node_modules/unist-util-select/index.js
  // 'transformIgnorePatterns': ["node_modules/(?!(lit-html|lit-element|lit|@lit)/)"],
  transformIgnorePatterns: [
    "node_modules/(?!(unified.*|unist-util.*|zwitch|vfile.*|micromark.*|remark.*|mdast.*|rehype.*|hast.*|longest-streak|bail|is-plain-obj|trough|.*)/)",
  ],
  transform: {
    // "^.+\\.tsx?$": "ts-jest",
    "^.+\\.(js|jsx|tsx?)$": [
      "babel-jest",
      {
        presets: ["@babel/preset-env"],
        plugins: [
          "@babel/transform-runtime",
          "@babel/plugin-transform-modules-commonjs",
        ],
      },
    ],
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
      displayName: "non-plugin-tests",
      testMatch: [
        "<rootDir>/packages/engine-test-utils/**/?(*.)+(spec|test).[jt]s?(x)",
        // see https://github.com/facebook/jest/issues/7914
        "<rootDir>/packages/engine-test-utils/**/__tests__/**/*.[jt]s?(x)",
        "<rootDir>/packages/engine-test-utils/**/*(*.)@(spec|test).[tj]s?(x)",
      ],
      ...commonConfig,
    },
  ],
};
