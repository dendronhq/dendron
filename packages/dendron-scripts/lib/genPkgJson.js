"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_extra_1 = __importDefault(require("fs-extra"));
const lodash_1 = __importDefault(require("lodash"));
const path_1 = __importDefault(require("path"));
const getPackages = (opts) => {
    let blacklist = [
        ".DS_Store",
        "lsp-client",
        "lsp-server",
        "generator-dendron",
    ];
    const packages = fs_extra_1.default.readdirSync("packages");
    if (opts === null || opts === void 0 ? void 0 : opts.blacklist) {
        blacklist = blacklist.concat(opts.blacklist);
    }
    return packages.filter((ent) => !blacklist.includes(ent));
};
const getPackagesBackend = (opts) => {
    let blacklist = [".DS_Store"];
    const packages = fs_extra_1.default.readdirSync(path_1.default.join("..", "dendron-backend", "packages"));
    if (opts === null || opts === void 0 ? void 0 : opts.blacklist) {
        blacklist = blacklist.concat(opts.blacklist);
    }
    return packages.filter((ent) => !blacklist.includes(ent));
};
function updateRepositoryMetadata({ pkgPath, pkgJson, repoUrl, }) {
    pkgJson.repository = {
        type: "git",
        url: repoUrl,
        directory: pkgPath,
    };
}
function addDeps(opts) {
    opts.deps.map(({ pkg, version, isDev }) => {
        const deps = isDev
            ? opts.pkgJson.devDependencies
            : opts.pkgJson.dependencies;
        deps[pkg] = version;
    });
}
const addScripts = ({ pkgJson, scripts, }) => {
    scripts.map(({ key, val }) => {
        pkgJson.scripts[key] = val;
    });
};
const addHuskyConfig = ({ pkgJson, root, }) => {
    pkgJson.husky = {
        hooks: {
            "pre-commit": "lint-staged && yarn hooks:pre-commit",
        },
    };
    if (root !== ".") {
        fs_extra_1.default.ensureDirSync(path_1.default.join(root, "hooks"));
        fs_extra_1.default.copySync(path_1.default.join("hooks"), path_1.default.join(root, "hooks"));
    }
};
const addPrettierConfig = ({ root }) => {
    const fpath = path_1.default.join(root, "prettier.config.js");
    fs_extra_1.default.writeFileSync(fpath, `module.exports = {
  tabWidth: 2,
  singleQuote: false,
};`);
    fs_extra_1.default.writeFileSync(path_1.default.join(root, ".prettierignore"), `
# compiled 
.next
vendor/**/*
lib
node_modules
out
dist
assets
raw-assets
# generated
launch.json
package.json
settings.json
public 
# config
*.lock
# tests
__snapshots__
# text
LICENSE
*.md
# scripts
*.sh
*.j2
`);
};
function removeDeps(opts) {
    if (lodash_1.default.has(opts.pkgJson.dependencies, "prettier")) {
        delete opts.pkgJson.dependencies["prettier"];
    }
    if (opts.pkgJson.devDependencies &&
        lodash_1.default.has(opts.pkgJson.devDependencies, "prettier")) {
        delete opts.pkgJson.devDependencies["prettier"];
    }
}
function updateRepositoryScripts({ pkgJson }) {
    if (!pkgJson.scripts) {
        pkgJson.scripts = {};
    }
    pkgJson.scripts["format"] = "echo nop";
}
function updateLernaPkgJson({ pkgJson }) {
    const key = "format:pkg";
    if (!pkgJson.scripts) {
        pkgJson.scripts = {};
    }
    pkgJson.scripts[key] = "prettier --write";
    pkgJson["lint-staged"] = {
        "*.{ts,tsx}": "prettier --config prettier.config.js --loglevel debug --write",
    };
}
function main() {
    const repos = [
        {
            root: ".",
            packages: getPackages({ blacklist: ["dendron-11ty"] }),
            repoUrl: "ssh://git@github.com/dendronhq/dendron.git",
        },
        {
            root: path_1.default.join("..", "dendron-backend"),
            packages: getPackagesBackend(),
            repoUrl: "ssh://git@github.com/dendronhq/dendron-backend.git",
        },
    ];
    repos.map(({ root, packages, repoUrl }) => {
        packages.map((pkgDir) => {
            const pkgPath = path_1.default.join("packages", pkgDir);
            const pkgPathFull = path_1.default.join(root, pkgPath);
            const pkgJsonPath = path_1.default.join(pkgPathFull, "package.json");
            const pkgRootJsonPath = path_1.default.join(root, "package.json");
            const pkgRootJson = fs_extra_1.default.readJSONSync(pkgRootJsonPath);
            const pkgJson = fs_extra_1.default.readJSONSync(pkgJsonPath);
            const opts = { pkgPath, pkgJson };
            // apply rules to monorepo root
            updateLernaPkgJson({ pkgJson: pkgRootJson, pkgPath: pkgRootJsonPath });
            addDeps({
                pkgJson: pkgRootJson,
                pkgPath: pkgRootJsonPath,
                deps: [
                    { pkg: "execa", version: "^5.0.0", isDev: true },
                    { pkg: "chalk", version: "^4.1.1", isDev: true },
                    { pkg: "prettier", version: "^2.0.4", isDev: true },
                    {
                        pkg: "husky",
                        version: "^4.2.5",
                        isDev: true,
                    },
                    {
                        pkg: "lint-staged",
                        version: ">=10",
                        isDev: true,
                    },
                ],
            });
            addHuskyConfig({ pkgJson: pkgRootJson, root });
            addPrettierConfig({ root });
            addScripts({
                pkgJson: pkgRootJson,
                scripts: [
                    {
                        key: "hooks:pre-commit",
                        val: "node ./hooks/pre-commit.js",
                    },
                ],
            });
            fs_extra_1.default.writeJSONSync(pkgRootJsonPath, pkgRootJson, { spaces: 2 });
            // apply to packages
            updateRepositoryMetadata({ ...opts, repoUrl });
            updateRepositoryScripts(opts);
            removeDeps(opts);
            // write
            fs_extra_1.default.writeJSONSync(pkgJsonPath, pkgJson, { spaces: 2 });
        });
    });
}
main();
//# sourceMappingURL=genPkgJson.js.map