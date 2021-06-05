import fs from "fs-extra";
import _ from "lodash";
import path from "path";

type PkgJson = {
  husky: any;
  "lint-staged": any;
  repository: {
    type: "git";
    url: string;
    directory: string;
  };
  dependencies: {
    [key: string]: string | undefined;
  };
  devDependencies?: {
    [key: string]: string | undefined;
  };
  scripts?: {
    [key: string]: string | undefined;
  };
};

const getPackages = (opts?: { blacklist: string[] }) => {
  let blacklist = [
    ".DS_Store",
    "lsp-client",
    "lsp-server",
    "generator-dendron",
  ];
  const packages = fs.readdirSync("packages");
  if (opts?.blacklist) {
    blacklist = blacklist.concat(opts.blacklist);
  }
  return packages.filter((ent) => !blacklist.includes(ent));
};

const getPackagesBackend = (opts?: { blacklist: string[] }) => {
  let blacklist = [".DS_Store"];
  const packages = fs.readdirSync(
    path.join("..", "dendron-backend", "packages")
  );
  if (opts?.blacklist) {
    blacklist = blacklist.concat(opts.blacklist);
  }
  return packages.filter((ent) => !blacklist.includes(ent));
};

type PkgUpdateOpts = {
  pkgPath: string;
  pkgJson: PkgJson;
};

function updateRepositoryMetadata({
  pkgPath,
  pkgJson,
  repoUrl,
}: PkgUpdateOpts & { repoUrl: string }) {
  pkgJson.repository = {
    type: "git",
    url: repoUrl,
    directory: pkgPath,
  };
}

function addDeps(
  opts: PkgUpdateOpts & {
    deps: { pkg: string; version: string; isDev?: boolean }[];
  }
) {
  opts.deps.map(({ pkg, version, isDev }) => {
    const deps = isDev
      ? opts.pkgJson.devDependencies!
      : opts.pkgJson.dependencies;
    deps[pkg] = version;
  });
}

const addScripts = ({
  pkgJson,
  scripts,
}: {
  pkgJson: PkgJson;
  scripts: { key: string; val: string }[];
}) => {
  scripts.map(({ key, val }) => {
    pkgJson.scripts![key] = val;
  });
};

const addHuskyConfig = ({
  pkgJson,
  root,
}: {
  pkgJson: PkgJson;
  root: string;
}) => {
  pkgJson.husky = {
    hooks: {
      "pre-commit": "lint-staged && yarn hooks:pre-commit",
    },
  };
  if (root !== ".") {
    fs.ensureDirSync(path.join(root, "hooks"));
    fs.copySync(path.join("hooks"), path.join(root, "hooks"));
  }
};

const addPrettierConfig = ({ root }: { root: string }) => {
  const fpath = path.join(root, "prettier.config.js");
  fs.writeFileSync(
    fpath,
    `module.exports = {
  tabWidth: 2,
  singleQuote: false,
};`
  );
  fs.writeFileSync(
    path.join(root, ".prettierignore"),
    `
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
`
  );
};

function removeDeps(opts: PkgUpdateOpts) {
  if (_.has(opts.pkgJson.dependencies, "prettier")) {
    delete opts.pkgJson.dependencies["prettier"];
  }
  if (
    opts.pkgJson.devDependencies &&
    _.has(opts.pkgJson.devDependencies, "prettier")
  ) {
    delete opts.pkgJson.devDependencies["prettier"];
  }
}

function updateRepositoryScripts({ pkgJson }: PkgUpdateOpts) {
  if (!pkgJson.scripts) {
    pkgJson.scripts = {};
  }
  pkgJson.scripts["format"] =
    "cd ../.. && yarn format:pkg $npm_package_repository_directory";
}

function updateLernaPkgJson({ pkgJson }: PkgUpdateOpts) {
  const key = "format:pkg";
  if (!pkgJson.scripts) {
    pkgJson.scripts = {};
  }
  pkgJson.scripts[key] = "prettier --write";
  pkgJson["lint-staged"] = {
    "*.{ts,tsx}":
      "prettier --config prettier.config.js --loglevel debug --write",
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
      root: path.join("..", "dendron-backend"),
      packages: getPackagesBackend(),
      repoUrl: "ssh://git@github.com/dendronhq/dendron-backend.git",
    },
  ];

  repos.map(({ root, packages, repoUrl }) => {
    packages.map((pkgDir) => {
      const pkgPath = path.join("packages", pkgDir);
      const pkgPathFull = path.join(root, pkgPath);
      const pkgJsonPath = path.join(pkgPathFull, "package.json");
      const pkgRootJsonPath = path.join(root, "package.json");
      const pkgRootJson = fs.readJSONSync(pkgRootJsonPath);
      const pkgJson = fs.readJSONSync(pkgJsonPath) as PkgJson;
      const opts: PkgUpdateOpts = { pkgPath, pkgJson };
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
      fs.writeJSONSync(pkgRootJsonPath, pkgRootJson, { spaces: 2 });
      // apply to packages
      updateRepositoryMetadata({ ...opts, repoUrl });
      updateRepositoryScripts(opts);
      removeDeps(opts);
      // write
      fs.writeJSONSync(pkgJsonPath, pkgJson, { spaces: 2 });
    });
  });
}

main();
