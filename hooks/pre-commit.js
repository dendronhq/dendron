const {checkToken} = require("./common");
const {exec} = require("./exec");

function main() {
  const gitCommand = `git diff --staged --name-only`;
  const stagedFiles = exec(gitCommand).stdout.split('\n');

  return checkToken({
    filesToCheck: stagedFiles,
    forbiddenTokens: {
      ".localhost": { rgx: /localhost:/, fileRgx: /\.lock$/ },
    }
  });
}

main();