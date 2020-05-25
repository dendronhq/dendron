const fs = require("fs");
const _ = require("lodash");

const DEPENDENCIES = {
  CLIENT_WEB: "@dendron/web-client",
  CLIENT_ELECTRON: "@dendron/electron-client",
  COMMON_ALL: "@dendron/common-all",
  COMMON_CLIENT: "@dendron/common-client",
};

const frontCommonDeps = [DEPENDENCIES.COMMON_ALL];
const electronClientDeps = [
  DEPENDENCIES.CLIENT_ELECTRON,
  DEPENDENCIES.COMMON_CLIENT,
];
const webClientDeps = [
  DEPENDENCIES.CLIENT_WEB,
  DEPENDENCIES.COMMON_ALL,
  DEPENDENCIES.COMMON_CLIENT,
];
const packages = {
  "electron-client": electronClientDeps,
  "web-client": webClientDeps,
};

function generateFrontCommonScripts() {
  let scope = frontCommonDeps.join(" --scope ");
  const group = "front-common";
  generateBootstrapScript({ scope, group });
  //generateBuildScript({ scope, group, standalone });
}

function generateClientScripts() {
  _.each(packages, (deps, pkg) => {
    let scope = deps.join(" --scope ");
    const group = pkg;
    generateBootstrapScript({ scope, group });
    generateBuildScript({ scope, group });
  });
}

// --- Lib

// --- Main
async function main() {
  // generateBackendScripts();
  // generateScraperScripts();
  // generateBackendFrontendScripts();
  // generateFrontendScripts();
  generateFrontCommonScripts();
  generateClientScripts();
  console.log("done");
}

main();

// === Rest

const backendDependencies = [
  DEPENDENCIES.COMMON_TEST_UTILS,
  DEPENDENCIES.SERVER_API,
  DEPENDENCIES.COMMON_ALL,
  DEPENDENCIES.HTTP_AWS_ES,
  DEPENDENCIES.SCRAPER_COMMON,
  DEPENDENCIES.CDK_CONSTANTS,
];

const backendDependenciesv2 = [
  { name: DEPENDENCIES.COMMON_ALL, phase: 0 },
  { name: DEPENDENCIES.CDK_CONSTANTS, phase: 0 },
  { name: DEPENDENCIES.HTTP_AWS_ES, phase: 0 },
  { name: DEPENDENCIES.SCRAPER_COMMON, phase: 1 },
  { name: DEPENDENCIES.COMMON_TEST_UTILS, phase: 2, dev: true },
  { name: DEPENDENCIES.SERVER_API, phase: 2 },
];

const scraperDependencies = [
  DEPENDENCIES.COMMON_TEST_UTILS,
  DEPENDENCIES.SCRAPERS,
  DEPENDENCIES.COMMON_ALL,
  DEPENDENCIES.HTTP_AWS_ES,
  DEPENDENCIES.CDK_CONSTANTS,
];

const frontendDependencies = [
  DEPENDENCIES.CLIENT_WEB,
  DEPENDENCIES.REACT_AUTOSUGGEST,
  DEPENDENCIES.HTTP_AWS_ES,
  DEPENDENCIES.COMMON_ALL,
];

const frontendStandaloneDependencies = [
  DEPENDENCIES.HTTP_AWS_ES,
  DEPENDENCIES.COMMON_ALL,
];

function generateBootstrapScript({ scope, group, standalone }) {
  const standaloneSection = `
lerna bootstrap --scope ${standalone}
`;

  let script = `
#!/usr/bin/env sh

${standalone ? standaloneSection : ""}

lerna bootstrap --scope ${scope}
`;
  writeScript(`./scripts/bootstrap-${group}.sh`, script);
}

function generateBuildScript({ scope, group, standalone }) {
  const standaloneSection = `
lerna run build --parallel --scope ${standalone}
`;

  script = `
#!/usr/bin/env sh

${standalone ? standaloneSection : ""}

lerna run build --parallel  --scope ${scope}
`;
  writeScript(`./scripts/build-${group}.sh`, script);
}

function generateScript({
  prefix,
  suffix,
  scope,
  ignorePhase,
  appendPast,
  skipDev,
}) {
  const lines = [];
  suffix = suffix || "";
  let lvl = 0;
  if (skipDev) {
    scope = _.reject(scope, { dev: true });
  }
  let left = [...scope];
  let pushed = [];
  if (ignorePhase) {
    lines.push(scope);
  } else {
    while (!_.isEmpty(left)) {
      const current = _.remove(left, { phase: lvl });
      pushed = pushed.concat(current);
      lvl += 1;
      if (appendPast) {
        lines.push(current.concat(pushed));
      } else {
        lines.push(current);
      }
      // _.remove(left, ent => current.includes(ent));
    }
  }
  console.log(lines);
  const scripts = `
#!/usr/bin/env sh
${lines
  .map(
    (l) => prefix + l.map((ent) => ent.name).join(" --scope ") + ` ${suffix}`
  )
  .join("\n")}
`;
  return scripts;
}

function generateWatchScript({ scope, group }) {
  const script = `
#!/usr/bin/env sh
lerna run watch --parallel --scope ${scope}
  `;
  writeScript(`./scripts/watch-${group}.sh`, script);
}

function writeScript(scriptPath, script) {
  console.log(script);
  fs.writeFileSync(scriptPath, script, "utf8");
  fs.chmodSync(scriptPath, "700");
}

// === Main

function generateScraperScripts() {
  let scope = scraperDependencies.join(" --scope ");
  let group = "scraper";
  let script = `
#!/usr/bin/env sh

# need to use production version, otherwise file size exceeds zip limit of lambda
lerna bootstrap --scope ${scope}
`;
  writeScript(`./scripts/bootstrap-${group}.sh`, script);

  script = `
#!/usr/bin/env sh

lerna run build --parallel  --scope ${scope}
`;
  writeScript(`./scripts/build-${group}.sh`, script);

  script = `
#!/usr/bin/env sh
lerna run watch --parallel --scope ${scope}`;

  writeScript(`./scripts/watch-${group}.sh`, script);
}

function generateBackendFrontendScripts() {
  let scope = backendDependencies
    .concat(frontendDependencies)
    .join(" --scope ");
  const group = "front_back";
  generateBootstrapScript({ scope, group });
  generateBuildScript({ scope, group });
  generateWatchScript({ scope, group });
}

function generateFrontendScripts() {
  let scope = frontendDependencies.join(" --scope ");
  let standalone = frontendStandaloneDependencies.join(" --scope ");
  const group = "frontend";
  generateBootstrapScript({ scope, group });
  generateBuildScript({ scope, group, standalone });
}

function generateBackendScripts() {
  let prefix;
  let scope = backendDependencies.join(" --scope ");

  // bootstrap prod
  prefix = "lerna bootstrap --scope ";
  const bootstrapScriptProd = generateScript({
    prefix,
    suffix: " -- --production",
    scope: backendDependenciesv2,
    ignorePhase: true,
    appendPast: false,
  });
  writeScript("./scripts/bootstrap-backend-prod.sh", bootstrapScriptProd);

  // bootstrap init
  prefix = "lerna bootstrap --scope ";
  const bootstrapScript = generateScript({
    prefix,
    scope: backendDependenciesv2,
    ignorePhase: false,
    appendPast: true,
  });
  writeScript("./scripts/bootstrap-backend.sh", bootstrapScript);

  // build dev
  prefix = "lerna run build --parallel --scope ";
  const buildBackendScript = generateScript({
    prefix,
    scope: backendDependenciesv2,
    ignorePhase: false,
  });
  writeScript("./scripts/build-backend.sh", buildBackendScript);

  // watch script
  prefix = "lerna run watch --parallel --scope ";
  const watchBackendScript = generateScript({
    prefix,
    scope: backendDependenciesv2,
    ignorePhase: false,
  });
  writeScript("./scripts/watch-backend.sh", watchBackendScript);
}
