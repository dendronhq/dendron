const {checkToken} = require("./common");
const {exec} = require("./exec");

function main() {
  // Where we would push if we ran `git push`
  const upstream = exec("git rev-parse --abbrev-ref @{push}").stdout.trim();
  // The files that would get pushed
  const filesToPush = exec(`git diff --name-only ${upstream}`).stdout.split('\n');

  return checkToken({
    filesToCheck: filesToPush,
    forbiddenTokens: {
      ".only": { rgx: /(describe|it|test)\.only/, fileRgx: /\.spec\.ts$/ },
      "debugger;": { rgx: /(^|\s)debugger;/, fileRgx: /\.ts$/ },
    }
  });
}

main();