import fs from "fs-extra";
import _ from "lodash";
import path from "path";

type PkgJson = {
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

type PkgUpdateOpts = {
  pkgPath: string;
  pkgJson: PkgJson;
};

function updateRepositoryMetadata({ pkgPath, pkgJson }: PkgUpdateOpts) {
  pkgJson.repository = {
    type: "git",
    url: "ssh://git@github.com/dendronhq/dendron.git",
    directory: pkgPath,
  };
}

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

function main() {
  const packages = getPackages({ blacklist: ["dendron-11ty"] });
  console.log(packages);
  packages.map((pkgDir) => {
    const pkgPath = path.join("packages", pkgDir);
    const pkgJsonPath = path.join(pkgPath, "package.json");
    const pkgJson = fs.readJSONSync(pkgJsonPath) as PkgJson;

    // apply rules
    const opts: PkgUpdateOpts = { pkgPath, pkgJson };
    updateRepositoryMetadata(opts);
    updateRepositoryScripts(opts);
    removeDeps(opts);
    fs.writeJSONSync(pkgJsonPath, pkgJson, { spaces: 2 });
  });
}

main();
