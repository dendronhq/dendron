const fs = require("fs-extra");
const path = require("path");
const _ = require("lodash");

const TASK_OVERRIDES = {
  "api-server": [
    {
      label: "test:watch:integ",
      command: "yarn test:watch:integ -- ${relativeFile} -u",
      type: "shell",
      problemMatcher: [],
      options: { env: { LOG_DST: "${env:TEMP}/dendron-api-server.log" } },
    },
  ],
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

const genTaskJSON = (opts) => {
  const { pkgName } = opts;
  return {
    version: "2.0.0",
    tasks: [
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
    ],
  };
};

const genLaunchJSON = (opts) => {
  const { pkgName } = opts;
  return {
    // Use IntelliSense to learn about possible Node.js debug attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    version: "0.2.0",
    configurations: [
      //   {
      //     type: "node",
      //     request: "launch",
      //     name: "test file",
      //     program:
      //       "${workspaceFolder:engine-server}/lib/${fileBasenameNoExtension}.js",
      //     cwd: "${workspaceFolder:engine-server}",
      //     sourceMaps: true,
      //     smartStep: true,
      //     outFiles: ["${workspaceFolder:engine-server}/lib/*.js"],
      //   },
      //   {
      //     type: "node",
      //     request: "launch",
      //     name: "debug all tests",
      //     program:
      //       "${workspaceFolder:engine-server}/node_modules/jest/bin/jest.js",
      //     cwd: "${workspaceFolder:engine-server}",
      //     args: ["--runInBand"],
      //   },
      {
        type: "node",
        request: "launch",
        name: "debug one test",
        program: "${workspaceFolder:root}/node_modules/jest/bin/jest.js",
        sourceMaps: true,
        smartStep: true,
        cwd: "${workspaceFolder:" + pkgName + "}",
        env: {
          LOG_DST: "stdout",
          LOG_LEVEL: "error",
        },
        args: ["--findRelatedTests", "--runInBand", "${relativeFile}", "-u"],
        outFiles: ["${workspaceFolder:" + pkgName + "}/lib/**/*.js"],
      },
    ],
  };
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
  ];
  const packages = fs.readdirSync("packages");
  packages
    .filter((ent) => !blacklist.includes(ent))
    .map((pkg) => {
      console.log("write launch.json", pkg);
      const launchPath = path.join("packages", pkg, ".vscode", "launch.json");
      const payload = genLaunchJSON({ pkgName: pkg });
      if (_.has(overrides, pkg)) {
        payload.configurations = payload.configurations.concat(overrides[pkg]);
      }
      fs.writeJSONSync(launchPath, payload, { spaces: 2 });

      console.log("write task.json", pkg);
      const launchPath2 = path.join("packages", pkg, ".vscode", "tasks.json");
      const payload2 = genTaskJSON({ pkgName: pkg });
      if (_.has(TASK_OVERRIDES, pkg)) {
        payload2.tasks = payload2.tasks.concat(TASK_OVERRIDES[pkg]);
      }
      fs.writeJSONSync(launchPath2, payload2, { spaces: 2 });
    });
}

main();
