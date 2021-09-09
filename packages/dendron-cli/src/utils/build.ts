import { DendronError } from "@dendronhq/common-all";
import { createLogger, findUpTo } from "@dendronhq/common-server";
import execa from "execa";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import semver from "semver";

type PkgJson = {
  name: string;
  displayName: string;
  description: string;
  main: string;
  version: string;
  repository: PkgRepository;
  devDependencies: { [key: string]: string };
};

type PkgRepository = {
  type: "git";
  url: string;
  directory?: string;
};

export enum SemverVersion {
  MAJOR = "major",
  MINOR = "minor",
  PATCH = "patch",
  PREPATCH = "prepatch",
}

export enum PublishEndpoint {
  LOCAL = "local",
  REMOTE = "remote",
}

const $ = (cmd: string, opts?: any) => {
  return execa.commandSync(cmd, { shell: true, ...opts });
};
const $$ = (cmd: string, opts?: any) => {
  return execa.command(cmd, { shell: true, ...opts });
};

export class LernaUtils {
  static bumpVersion(version: SemverVersion) {
    $(`lerna version ${version} --no-git-tag-version`);
    $(`git add .`);
    $(`git commit -m "chore: publish ${version}"`);
  }

  static publishVersion() {
    $(`lerna publish from-package --ignore-scripts`);
    $(`node bootstrap/scripts/genMeta.js`);
    $(`bootstrap/scripts/patch11tyVersion.sh`);
  }
}

export class BuildUtils {
  static getLernaRoot() {
    const maybeRoot = findUpTo({
      base: process.cwd(),
      fname: "lerna.json",
      returnDirPath: true,
      maxLvl: 4,
    });
    if (!maybeRoot) {
      throw new DendronError({
        message: `no lerna root found from ${process.cwd()}`,
      });
    }
    return maybeRoot;
  }

  static getCurrentVersion(): string {
    return fs.readJSONSync(path.join(this.getLernaRoot(), "lerna.json"))
      .version;
  }

  static getPluginRootPath() {
    return path.join(this.getLernaRoot(), "packages", "plugin-core");
  }

  static getNextServerRootPath() {
    return path.join(this.getLernaRoot(), "packages", "dendron-next-server");
  }

  static getPkgMeta({ pkgPath }: { pkgPath: string }) {
    return fs.readJSONSync(pkgPath) as PkgJson;
  }

  static restorePluginPkgJson() {
    const pkgPath = path.join(this.getPluginRootPath(), "package.json");
    $(`git checkout -- ${pkgPath}`);
  }

  static setRegLocal() {
    $(`yarn config set registry http://localhost:4873`);
    $(`npm set registry http://localhost:4873/`);
  }

  static setRegRemote() {
    $(`yarn config set registry https://registry.npmjs.org/`);
    $(`npm set registry https://registry.npmjs.org/`);
  }

  static genNextVersion(opts: {
    currentVersion: string;
    upgradeType: SemverVersion;
  }) {
    return semver.inc(opts.currentVersion, opts.upgradeType) as string;
  }

  static buildNextServer() {
    const root = this.getNextServerRootPath();
    $(`yarn  --ignore-lockfile`, { cwd: root });
    $(`yarn build`, { cwd: root });
    $(`yarn gen:theme`, { cwd: root });
  }

  static bump11ty(opts: { currentVersion: string; nextVersion: string }) {
    const root = this.getPluginRootPath();
    const sitePath = path.join(root, "src", "utils", "site.ts");
    const dst = `dendron-11ty": "^${opts.nextVersion.replace(/^0./, "1.")}"`;

    const newContent = fs
      .readFileSync(sitePath, { encoding: "utf8" })
      .replace(/dendron-11ty.*/, dst);
    fs.writeFileSync(sitePath, newContent);
    $("git add packages/plugin-core/src/utils/site.ts");
    const { stdout, stderr } = $(`git commit -m "chore: bump 11ty"`);
    console.log(stdout, stderr);
    return;
  }

  static installPluginDependencies() {
    // remove root package.json before installing locally
    fs.removeSync(path.join(this.getLernaRoot(), "package.json"));
    return $(`yarn install --no-lockfile`, { cwd: this.getPluginRootPath() });
  }

  static installPluginLocally(version: string) {
    return Promise.all([
      $$(
        `code-insiders --install-extension "dendron-${version}.vsix" --force`,
        { cwd: this.getPluginRootPath() }
      ),
      $$(`codium --install-extension "dendron-${version}.vsix" --force`, {
        cwd: this.getPluginRootPath(),
      }),
    ]);
  }

  static packagePluginDependencies() {
    return $(`vsce package --yarn`, { cwd: this.getPluginRootPath() });
  }

  static prepPluginPkg() {
    const pkgPath = path.join(this.getPluginRootPath(), "package.json");
    this.updatePkgMeta({
      pkgPath,
      name: "dendron",
      main: "./dist/extension.js",
      repository: {
        url: "https://github.com/dendronhq/dendron.git",
        type: "git",
      },
    });
    this.removeDevDepsFromPkgJson({
      pkgPath,
      dependencies: [
        "@dendronhq/common-test-utils",
        "@dendronhq/engine-test-utils",
      ],
    });
  }

  /**
   * Set NPM to publish locally
   */
  static async prepPublishLocal() {
    this.setRegLocal();
    // this.startVerdaccio();
    // // HACK: give verdaccio chance to start
    // await this.sleep(3000);
    return;
  }

  /**
   * Set NPM to publish remotely
   */
  static async prepPublishRemote() {
    this.setRegRemote();
  }

  /**
   *
   * @returns
   * @throws Error if typecheck is not successful
   */
  static runTypeCheck() {
    $("yarn lerna:typecheck", { cwd: this.getLernaRoot() });
  }

  static async sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({});
      }, ms);
    });
  }

  static startVerdaccio() {
    const subprocess = execa("verdaccio");
    const logger = createLogger("verdaccio");
    subprocess.on("close", () => {
      logger.error({ state: "close" });
    });
    subprocess.on("disconnect", () => {
      logger.error({ state: "disconnect" });
    });
    subprocess.on("exit", () => {
      logger.error({ state: "exit" });
    });
    subprocess.on("error", (err) => {
      logger.error({ state: "error", payload: err });
    });
    subprocess.on("message", (message) => {
      logger.info({ state: "message", message });
    });
    if (subprocess.stdout && subprocess.stderr) {
      subprocess.stdout.on("data", (chunk: Buffer) => {
        process.stdout.write(chunk);
        // verdaccio is ready
        // if (chunk.toString().match("http address")) {
        // }
      });
      subprocess.stderr.on("data", (chunk) => {
        process.stdout.write(chunk);
      });
    }
    return subprocess;
  }

  static async syncStaticAssets() {
    const pluginAssetPath = path.join(this.getPluginRootPath(), "assets");
    const pluginStaticPath = path.join(pluginAssetPath, "static");
    const apiRoot = path.join(this.getLernaRoot(), "packages", "api-server");
    const nextServerRoot = this.getNextServerRootPath();

    fs.ensureDirSync(pluginStaticPath);
    fs.emptyDirSync(pluginStaticPath);

    fs.copySync(path.join(nextServerRoot, "out"), pluginStaticPath);
    await Promise.all([
      fs.copy(
        path.join(this.getNextServerRootPath(), "assets", "js"),
        pluginStaticPath
      ),
      fs.copy(path.join(apiRoot, "assets", "static"), pluginStaticPath),
    ]);
    return;
  }

  static removeDevDepsFromPkgJson({
    pkgPath,
    dependencies,
  }: {
    pkgPath: string;
    dependencies: string[];
  }) {
    const pkg = fs.readJSONSync(pkgPath) as PkgJson;
    _.forEach(pkg.devDependencies, (_v, k) => {
      if (dependencies.includes(k)) {
        delete pkg.devDependencies[k];
      }
    });
    fs.writeJSONSync(pkgPath, pkg, { spaces: 4 });
  }

  static updatePkgMeta({
    pkgPath,
    name,
    description,
    main,
    repository,
  }: {
    pkgPath: string;
    name: string;
  } & Partial<PkgJson>) {
    const pkg = fs.readJSONSync(pkgPath) as PkgJson;
    pkg.name = name;
    if (description) {
      pkg.description = description;
    }
    if (main) {
      pkg.main = main;
    }
    if (repository) {
      pkg.repository = repository;
    }
    pkg.main = "dist/extension.js";
    fs.writeJSONSync(pkgPath, pkg, { spaces: 4 });
  }

  static async installAndPackageDeps({ cwd }: { cwd: string }) {
    await $("yarn install --no-lockfile", { cwd });
    await $("vsce package --yarn", { cwd });
  }

  static async publish({ cwd, osvxKey }: { cwd: string; osvxKey: string }) {
    return await Promise.all([
      $("vsce publish", { cwd }),
      $("ovsx publish", {
        cwd,
        env: {
          OVSX_PAT: osvxKey,
        },
      }),
    ]);
  }

  static async publishInsider() {
    const pkgPath = this.getPluginRootPath();
    const { name, version } = await this.getPkgMeta({ pkgPath });
    const pkg = `${name}-${version}.vsix`;
    const bucket = "org-dendron-public-assets";
    await $(`aws s3 cp $package s3://${bucket}/publish/$${pkg}`);
    console.log(`https://${bucket}.s3.amazonaws.com/publish/${pkg}`);
  }
}
