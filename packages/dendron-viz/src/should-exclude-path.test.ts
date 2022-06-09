import { shouldExcludePath } from "./should-exclude-path";

describe("shouldExcludePath", () => {
  it("excludes based on folder or perfect match relative to root", () => {
    const excludePaths = new Set(["node_modules/", "yarn.lock"]);
    const excludeGlobs: string[] = [];

    const testShouldExcludePath = (path: string) =>
      shouldExcludePath(path, excludePaths, excludeGlobs);

    expect(testShouldExcludePath("node_modules/")).toEqual(true);
    expect(testShouldExcludePath("yarn.lock")).toEqual(true);

    // Non-matched files work
    expect(testShouldExcludePath("src/app.js")).toEqual(false);
    expect(testShouldExcludePath("src/yarn.lock")).toEqual(false);
  });

  it("excludes based on micromatch globs", () => {
    const excludePaths = new Set<string>();
    const excludeGlobs = [
      "node_modules/**", // exclude same items as paths
      "**/yarn.lock", // avoid all yarn.locks
      "**/*.png", // file extension block
      "**/!(*.module).ts", // Negation:  block non-module files, not regular ones
    ];

    const testShouldExcludePath = (path: string) =>
      shouldExcludePath(path, excludePaths, excludeGlobs);

    expect(testShouldExcludePath("node_modules/jest/index.js")).toEqual(true);
    expect(testShouldExcludePath("node_modules/jest")).toEqual(true);

    // Block all nested lockfiles
    expect(testShouldExcludePath("yarn.lock")).toEqual(true);
    expect(testShouldExcludePath("subpackage/yarn.lock")).toEqual(true);

    // Block by file extension
    expect(testShouldExcludePath("src/docs/boo.png")).toEqual(true);
    expect(testShouldExcludePath("test/boo.png")).toEqual(true);
    expect(testShouldExcludePath("boo.png")).toEqual(true);

    // Block TS files unless they are modules
    expect(testShouldExcludePath("index.ts")).toEqual(true);
    expect(testShouldExcludePath("index.module.ts")).toEqual(false);

    // Regular files work
    expect(testShouldExcludePath("src/index.js")).toEqual(false);
  });
});
