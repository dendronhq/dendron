const { checkToken } = require("./common");
const { exec } = require("./exec");

function main() {
  // Where we would push if we ran `git push`
  let upstream;
  try {
    upstream = exec("git rev-parse --abbrev-ref @{push}").stdout.trim();
  } catch {
    // Fallback to first origin if none are set
    upstream = `${exec("git remote").stdout.trim().split("\n")[0]}/master`;
    // eslint-disable-next-line no-console
    console.log("error", upstream);
  }
  // The files that would get pushed
  const filesToPush = exec(`git diff --name-only ${upstream}`).stdout.split(
    "\n"
  );

  return checkToken({
    filesToCheck: filesToPush,
    forbiddenTokens: {
      ".only": {
        rgx: /(suite|describe|it|test)\.only/,
        fileRgx: /(\.spec\.ts$)|(\.test\.ts$)/,
      },
      "debugger;": { rgx: /(^|\s)debugger/, fileRgx: /\.ts$/ },
      "rel import of monorepo pkg": {
        rgx: /(\.\.\/(common-frontend|common-all|common-server|engine-server|dendron-cli|pods-core|api-server|common-test-utils|engine-test-utils|dendron-next-server))/,
        fileRgx: /\.ts[x]?$/,
      },
    },
  });
}

main();
