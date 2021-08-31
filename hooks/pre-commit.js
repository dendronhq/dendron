const {checkToken} = require("./common");
const {exec} = require("./exec");

const ErrorMessages = {
  AVOID_DIRECT_IMPORT_FROM_PACKAGES:[
    `Direct import from a package.`,
    `This check catches direct imports such as:`,
    `import { milliseconds } from "@dendronhq/common-all/lib/timing";`,
    `While the above import should look as:`,
    `import { milliseconds } from "@dendronhq/common-all";`
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
