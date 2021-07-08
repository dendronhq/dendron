/* eslint-disable  no-template-curly-in-string */
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

const enum PACKAGE {
  "api-server" = "api-server",
  "common-all" = "common-all",
  "common-server" = "common-server",
  "common-test-utils" = "common-test-utils",
  "dendron-cli" = "dendron-cli",
  "dendron-next-server" = "dendron-next-server",
  "engine-server" = "engine-server",
  "engine-test-utils" = "engine-test-utils",
  "generator-dendron" = "generator-dendron",
  //   'LSP_CLIENT_UBER'='lsp-client-uber',
  //   'LSP_SERVER'='lsp-server',
  "plugin-core" = "plugin-core",
  "pods-core" = "pods-core",
}

const PACKAGE_SETTINGS = {
  [PACKAGE["common-server"]]: {
    skipTests: true,
  },
  [PACKAGE["engine-server"]]: {
    skipTests: true,
  },
};

type GenConfigOpts = {
  pkgName: string;
  skipTests?: boolean;
};

const TASK_OVERRIDES = {
  "dendron-cli": [
    {
      label: "chmod +x",
      command: "chmod +x lib/bin/dendron-cli.js",
      type: "shell",
      problemMatcher: [],
    },
    {
      label: "watch-vault-dev",
      type: "shell",
      command:
        "nodemon --watch '/Users/kevinlin/projects/dendronv2/dendron-template/vault' --watch '${workspaceFolder}/**/*'  --ext md,ts lib/bin/dendron-cli.js build-site --vault /Users/kevinlin/projects/dendronv2/dendron-template/vault --dendronRoot /Users/kevinlin/projects/dendronv2/dendron-template",
      problemMatcher: [],
    },
    {
      label: "build-site",
      type: "shell",
      command:
        "node --inspect lib/bin/dendron-cli.js buildSiteV2 --wsRoot /Users/kevinlin/Dropbox/Apps/Noah --stage dev --enginePort `cat /Users/kevinlin/Dropbox/Apps/Noah/.dendron.port`",
      options: {},
      problemMatcher: [],
    },
    {
      label: "export-pod",
      type: "shell",
      command:
        "node --inspect /usr/local/bin/dendron-cli exportPod --wsRoot ~/Dendron --podId dendron.airtable --podPkg @dendronhq/airtable-pod --podSource remote --showConfig",
      options: {
        cwd: "/Users/kevinlin/Dendron",
      },
      problemMatcher: [],
    },
  ],
};

const genTaskJSON = (opts: GenConfigOpts) => {
  const { pkgName, skipTests } = opts;
  const config = {
    version: "2.0.0",
    tasks: [] as any,
  };
  if (!skipTests) {
    config.tasks = config.tasks.concat([
      {
        label: "test:watch",
        command: "yarn test:watch ${relativeFile} -u",
        type: "shell",
        problemMatcher: [],
        options: { env: { LOG_DST: "../../logs/" + pkgName + ".log" } },
      },
      {
        type: "npm",
        label: "test:all",
        script: "test",
        group: {
          kind: "test",
          isDefault: true,
        },
        problemMatcher: [],
      },
    ]);
  }
  return config;
};

const genLaunchJSON = (opts: GenConfigOpts) => {
  const { pkgName, skipTests } = opts;
  const config: any = {
    // Use IntelliSense to learn about possible Node.js debug attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    version: "0.2.0",
    configurations: [],
  };
  if (!skipTests) {
    config.configurations.push({
      type: "node",
      request: "launch",
      name: "debug one test",
      program: "${workspaceFolder:root}/node_modules/jest/bin/jest.js",
      sourceMaps: true,
      smartStep: true,
      cwd: "${workspaceFolder:" + pkgName + "}",
      env: {
        LOG_DST: "stdout",
        LOG_LEVEL: "info",
      },
      args: ["--findRelatedTests", "--runInBand", "${relativeFile}", "-u"],
      outFiles: ["${workspaceFolder:" + pkgName + "}/lib/**/*.js"],
    });
  }
  return config;
};

const overrides = {
  "api-server": [
    {
      type: "node",
      name: "start debug server",
      request: "launch",
      runtimeArgs: ["-r", "ts-node/register"],
      env: {
        PORT: "3005",
        TS_NODE_LOG_ERROR: "1",
        LOG_NAME: "api-server",
        LOG_DST: "../../logs/api-server.log",
        LOG_LEVEL: "debug",
      },
      args: ["${workspaceFolder:api-server}/src/start.ts"],
    },
  ],
};

async function main() {
  const blacklist = [
    ".DS_Store",
    "plugin-core",
    "dendron-11ty",
    "dendron-next-server",
    "lsp-client",
    "lsp-server",
    PACKAGE["generator-dendron"],
  ];
  const packages = fs.readdirSync("packages");
  packages
    .filter((ent) => !blacklist.includes(ent))
    .map((pkg) => {
      console.log("write launch.json", pkg);
      const launchPath = path.join("packages", pkg, ".vscode", "launch.json");
      const settings = _.get(PACKAGE_SETTINGS, pkg, {});
      console.log("bond", pkg, settings);

      const payload = genLaunchJSON({ pkgName: pkg, ...settings });
      if (_.has(overrides, pkg)) {
        //@ts-ignore
        payload.configurations = payload.configurations.concat(overrides[pkg]);
      }
      fs.writeJSONSync(launchPath, payload, { spaces: 2 });

      console.log("write task.json", pkg);
      const launchPath2 = path.join("packages", pkg, ".vscode", "tasks.json");

      const payload2 = genTaskJSON({ pkgName: pkg, ...settings });
      if (_.has(TASK_OVERRIDES, pkg)) {
        //@ts-ignore
        payload2.tasks = payload2.tasks.concat(TASK_OVERRIDES[pkg]);
      }
      fs.writeJSONSync(launchPath2, payload2, { spaces: 2 });
    });
}

main();
