/* eslint-disable no-console */
const { checkToken } = require("./common");
const { exec } = require("./exec");
const madge = require("madge");
const path = require("path");

/**
 * Uses madge to check for circular dependencies. Issues soft warning if
 * circular dependencies detected
 */
function checkCircularDependencies(path, threshold) {
  madge(path, {
    fileExtensions: ["ts"],
  }).then((res) => {
    const circDepCount = res.circular().length;
    if (circDepCount === 0) {
      console.log(`No circular dependencies detected for ${path}`);
    } else if (circDepCount <= threshold) {
      console.log(
        `Circular dependency count of ${circDepCount} is lower than or equal threshold of ${threshold} for ${path}.`
      );
    } else {
      console.error(
        `ERROR: ${
          res.circular().length
        } circular dependencies detected in ${path}, which exceeds the threshold of ${threshold}. Please ensure you are not introducing new circular dependencies by running the following on the commit prior to your change: \nnpm -g install madge && cd ${path} && madge --circular --extensions ts .\n\nFor more details, see https://docs.dendron.so/notes/773e0b5a-510f-4c21-acf4-2d1ab3ed741e/#avoiding-circular-dependencies`
      );
      process.exit(1);
    }
  });
}

function main() {
  // Lower these each time we fix a circular dependency:
  const COMMON_ALL_CIRCULAR_DEP_THRESHOLD = 0;
  const COMMON_FRONTEND_CIRCULAR_DEP_THRESHOLD = 0;
  const COMMON_SERVER_CIRCULAR_DEP_THRESHOLD = 1;
  const CLI_CIRCULAR_DEP_THRESHOLD = 0;
  const PLUGIN_VIEWS_CIRCULAR_DEP_THRESHOLD = 0;
  const NEXTJS_TEMPLATE_CIRCULAR_DEP_THRESHOLD = 3;
  const VIZ_CIRCULAR_DEP_THRESHOLD = 0;
  const ENGINE_SERVER_CIRCULAR_DEP_THRESHOLD = 0;
  const PLUGIN_CORE_CIRCULAR_DEP_THRESHOLD = 1;
  const PODS_CORE_CIRCULAR_DEP_THRESHOLD = 0;
  const UNIFIED_CIRCULAR_DEP_THRESHOLD = 22;

  const rootPath = exec("git rev-parse --show-toplevel").stdout;

  checkCircularDependencies(
    path.resolve(rootPath, "packages/plugin-core"),
    PLUGIN_CORE_CIRCULAR_DEP_THRESHOLD
  );

  checkCircularDependencies(
    path.resolve(rootPath, "packages/common-all/src"),
    COMMON_ALL_CIRCULAR_DEP_THRESHOLD
  );

  checkCircularDependencies(
    path.resolve(rootPath, "packages/common-server/src"),
    COMMON_SERVER_CIRCULAR_DEP_THRESHOLD
  );

  checkCircularDependencies(
    path.resolve(rootPath, "packages/common-frontend/src"),
    COMMON_FRONTEND_CIRCULAR_DEP_THRESHOLD
  );

  checkCircularDependencies(
    path.resolve(rootPath, "packages/dendron-cli/src"),
    CLI_CIRCULAR_DEP_THRESHOLD
  );

  checkCircularDependencies(
    path.resolve(rootPath, "packages/unified/src"),
    UNIFIED_CIRCULAR_DEP_THRESHOLD
  );

  checkCircularDependencies(
    path.resolve(rootPath, "packages/dendron-plugin-views/src"),
    PLUGIN_VIEWS_CIRCULAR_DEP_THRESHOLD
  );

  checkCircularDependencies(
    path.resolve(rootPath, "packages/dendron-viz/src"),
    VIZ_CIRCULAR_DEP_THRESHOLD
  );

  checkCircularDependencies(
    path.resolve(rootPath, "packages/engine-server/src"),
    ENGINE_SERVER_CIRCULAR_DEP_THRESHOLD
  );

  checkCircularDependencies(
    path.resolve(rootPath, "packages/nextjs-template"),
    NEXTJS_TEMPLATE_CIRCULAR_DEP_THRESHOLD
  );

  checkCircularDependencies(
    path.resolve(rootPath, "packages/pods-core/src"),
    PODS_CORE_CIRCULAR_DEP_THRESHOLD
  );

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
        fileIgnoreRgx: /dnode\.spec\.ts/,
      },
      "debugger;": { rgx: /(^|\s)debugger/, fileRgx: /\.ts$/ },
      "rel import of monorepo pkg": {
        rgx: /(\.\.\/(common-frontend|common-all|common-server|engine-server|dendron-cli|pods-core|api-server|common-test-utils|engine-test-utils))/,
        fileRgx: /\.ts[x]?$/,
      },
    },
  });
}

main();
