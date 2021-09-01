const {checkToken} = require("./common");
const {exec} = require("./exec");

const ErrorMessages = {
  AVOID_DIRECT_IMPORT_FROM_PACKAGES:[
    `Direct import from a package.`,
    `This check catches direct imports such as:`,
    `import { your_import1 } from "@dendronhq/common-all/path1";`,
    `import { your_import2 } from "@dendronhq/common-server/path2";`,
    `While the above imports should look as:`,
    `import { your_import1 } from "@dendronhq/common-all";`,
    `import { your_import2 } from "@dendronhq/common-server";`
  ].join('\n')
}

function main() {
  const gitCommand = `git diff --staged --name-only`;
  const stagedFiles = exec(gitCommand).stdout.split('\n');

  return checkToken({
    filesToCheck: stagedFiles,
    forbiddenTokens: {
      ".localhost": { rgx: /localhost:/, fileRgx: /\.lock$/ },

      [ErrorMessages.AVOID_DIRECT_IMPORT_FROM_PACKAGES]: {
        rgx: /((common-frontend|common-all|common-server|engine-server|dendron-cli|pods-core|api-server|common-test-utils|engine-test-utils|dendron-next-server)\/)/,
        fileRgx: /\.ts[x]?$/ },
    }
  });
}

main();
