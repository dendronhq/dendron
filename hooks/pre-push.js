const {checkToken} = require("./common");
const {exec} = require("./exec");

function main() {
  // Where we would push if we ran `git push`
  let upstream;
  try {
    upstream = exec("git rev-parse --abbrev-ref @{push}").stdout.trim();
  } catch {
    // Fallback to first origin if none are set
    upstream = `${exec("git remote").stdout.trim().split("\n")[0]}/master`;
  }
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