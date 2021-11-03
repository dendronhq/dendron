const { checkToken } = require("./common");
const { exec } = require("./exec");

const path = require("path");
const fs = require("fs-extra");

const ErrorMessages = {
  AVOID_DIRECT_IMPORT_FROM_PACKAGES: [
    `Direct import from a package.`,
    `This check catches direct imports such as:`,
    `import { your_import1 } from "@dendronhq/common-all/path1";`,
    `import { your_import2 } from "@dendronhq/common-server/path2";`,
    `While the above imports should look as:`,
    `import { your_import1 } from "@dendronhq/common-all";`,
    `import { your_import2 } from "@dendronhq/common-server";`,
  ].join("\n"),
};

function checkVSCodeCompatibilityVersion() {
  const filePath = path.resolve(
    process.cwd(),
    "packages/plugin-core/package.json"
  );
  if (fs.existsSync(filePath)) {
    const content = fs.readJsonSync(filePath);

    const compatVersion = content.engines["vscode"];
    const apiVersion = content.dependencies["@types/vscode"];

    if (!compatVersion.includes(apiVersion)) {
      console.error(
        "The vscode api version does not match the engine compatibility version! Update the compatibility version to match in plugin-core/package.json. See https://code.visualstudio.com/api/working-with-extensions/publishing-extension#visual-studio-code-compatibility"
      );
      console.log("api version: " + apiVersion);
      console.log("compatibility version: " + compatVersion);
      process.exit(1);
    }
  } else {
    console.log(
      "Unable to find plugin-core/package.json! VS Code Compatibility Check skipped"
    );
  }
}

function main() {
  // checkVSCodeCompatibilityVersion();

  const gitCommand = `git diff --staged --name-only`;
  const stagedFiles = exec(gitCommand).stdout.split("\n");

  return checkToken({
    filesToCheck: stagedFiles,
    forbiddenTokens: {
      ".localhost": { rgx: /localhost:/, fileRgx: /\.lock$/ },

      [ErrorMessages.AVOID_DIRECT_IMPORT_FROM_PACKAGES]: {
        rgx: /import.*((common-frontend|common-all|common-server|engine-server|dendron-cli|pods-core|api-server|common-test-utils|engine-test-utils|dendron-next-server)\/)/,
        fileRgx: /\.ts[x]?$/,
      },
    },
  });
}

main();
