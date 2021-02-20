const fs = require("fs-extra");
const path = require("path");
const _ = require("lodash");

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
  const blacklist = [".DS_Store", "plugin-core", "dendron-11ty", "dendron-next-server", "lsp-client", "lsp-server"];
  const packages = fs.readdirSync("packages");
  packages
    .filter((ent) => !blacklist.includes(ent))
    .map((pkg) => {
      const launchPath = path.join("packages", pkg, ".vscode", "launch.json");
      const payload = genLaunchJSON({ pkgName: pkg });
      if (_.has(overrides, pkg)) {
        payload.configurations = payload.configurations.concat(overrides[pkg]);
      }
      console.log(JSON.stringify(payload, null, 2));
      fs.writeJSONSync(launchPath, payload, { spaces: 2 });
    });
}

main();
