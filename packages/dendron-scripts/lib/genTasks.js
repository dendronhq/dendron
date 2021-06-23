"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const PACKAGE_SETTINGS = {
    ["common-server" /* "common-server" */]: {
        skipTests: true,
    },
    ["engine-server" /* "engine-server" */]: {
        skipTests: true,
    },
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
            command: "nodemon --watch '/Users/kevinlin/projects/dendronv2/dendron-template/vault' --watch '${workspaceFolder}/**/*'  --ext md,ts lib/bin/dendron-cli.js build-site --vault /Users/kevinlin/projects/dendronv2/dendron-template/vault --dendronRoot /Users/kevinlin/projects/dendronv2/dendron-template",
            problemMatcher: [],
        },
        {
            label: "build-site",
            type: "shell",
            command: "node --inspect lib/bin/dendron-cli.js buildSiteV2 --wsRoot /Users/kevinlin/Dropbox/Apps/Noah --stage dev --enginePort `cat /Users/kevinlin/Dropbox/Apps/Noah/.dendron.port`",
            options: {},
            problemMatcher: [],
        },
        {
            label: "export-pod",
            type: "shell",
            command: "node --inspect /usr/local/bin/dendron-cli exportPod --wsRoot ~/Dendron --podId dendron.airtable --podPkg @dendronhq/airtable-pod --podSource remote --showConfig",
            options: {
                cwd: "/Users/kevinlin/Dendron",
            },
            problemMatcher: [],
        },
    ],
};
const genTaskJSON = (opts) => {
    const { pkgName, skipTests } = opts;
    const config = {
        version: "2.0.0",
        tasks: [],
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
const genLaunchJSON = (opts) => {
    const { pkgName, skipTests } = opts;
    const config = {
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
        "generator-dendron" /* "generator-dendron" */,
    ];
    const packages = fs_extra_1.default.readdirSync("packages");
    packages
        .filter((ent) => !blacklist.includes(ent))
        .map((pkg) => {
        console.log("write launch.json", pkg);
        const launchPath = path_1.default.join("packages", pkg, ".vscode", "launch.json");
        const settings = lodash_1.default.get(PACKAGE_SETTINGS, pkg, {});
        console.log("bond", pkg, settings);
        const payload = genLaunchJSON({ pkgName: pkg, ...settings });
        if (lodash_1.default.has(overrides, pkg)) {
            //@ts-ignore
            payload.configurations = payload.configurations.concat(overrides[pkg]);
        }
        fs_extra_1.default.writeJSONSync(launchPath, payload, { spaces: 2 });
        console.log("write task.json", pkg);
        const launchPath2 = path_1.default.join("packages", pkg, ".vscode", "tasks.json");
        const payload2 = genTaskJSON({ pkgName: pkg, ...settings });
        if (lodash_1.default.has(TASK_OVERRIDES, pkg)) {
            //@ts-ignore
            payload2.tasks = payload2.tasks.concat(TASK_OVERRIDES[pkg]);
        }
        fs_extra_1.default.writeJSONSync(launchPath2, payload2, { spaces: 2 });
    });
}
main();
//# sourceMappingURL=genTasks.js.map