/* eslint-disable no-console */
const { checkToken } = require("./common");
const { exec } = require("./exec");
const madge = require("madge");
const path = require("path");

/**
 * Uses madge to check for circular dependencies. Issues soft warning if
 * circular dependencies detected
 */
function checkCircularDependencies() {
  const CIRCULAR_DEP_THRESHOLD = 2; // Lower this each time we fix a circular dependency
  const rootPath = exec("git rev-parse --show-toplevel").stdout;
  const filePath = path.resolve(rootPath, "packages/plugin-core");
  madge(filePath, {
    fileExtensions: ["ts"],
  }).then((res) => {
    const circDepCount = res.circular().length;
    if (circDepCount === 0) {
      console.log("No circular dependencies detected");
    } else if (circDepCount <= CIRCULAR_DEP_THRESHOLD) {
      console.log(
        `Circular dependency count of ${circDepCount} is lower than or equal threshold of ${CIRCULAR_DEP_THRESHOLD}`
      );
    } else {
      console.error(
        `ERROR: ${
          res.circular().length
        } circular dependencies detected in plugin-core, which exceeds the threshold of ${CIRCULAR_DEP_THRESHOLD}. Please ensure you are not introducing new circular dependencies by running the following on the commit prior to your change: \nnpm -g install madge && cd $DENDRON_REPO_ROOT/packages/plugin-core && madge --circular --extensions ts .\n\nFor more details, see https://docs.dendron.so/notes/773e0b5a-510f-4c21-acf4-2d1ab3ed741e/#avoiding-circular-dependencies`
      );
      process.exit(1);
    }
  });
}

function main() {
  checkCircularDependencies();

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
