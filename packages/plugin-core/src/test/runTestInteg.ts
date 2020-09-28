import * as path from "path";

import { runTests } from "vscode-test";

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");

    const extensionTestsPath = path.resolve(__dirname, "./suite-integ/index");

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      extensionTestsEnv: { STAGE: "test" },
    });
  } catch (err) {
    console.error("Failed to run tests");
    process.exit(1);
  }
}

main();
