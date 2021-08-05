import { command as $ } from "execa";
import fs from "fs-extra";
import path from "path";
import semver from "semver";

type PkgJson = {
  name: string;
  displayName: string;
  description: string;
  main: string;
  version: string;
};

export enum SemverVersion {
  MAJOR = "major",
  MINOR = "minor",
  PATCH = "patch",
}

export class BuildUtils {
  static getLernaRoot() {
    return process.cwd();
  }

  static getCurrentVersion(): string {
    return fs.readJSONSync(path.join(this.getLernaRoot(), "lerna.json"))
      .version;
  }

  static getPluginPkgPath() {
    return path.join(this.getLernaRoot(), "packages", "plugin-core");
  }

  static getPkgMeta({ pkgPath }: { pkgPath: string }) {
    return fs.readJSONSync(pkgPath) as PkgJson;
  }

  static genNextVersion(opts: {
    currentVersion: string;
    upgradeType: SemverVersion;
  }) {
    return semver.inc(opts.currentVersion, opts.upgradeType) as string;
  }

  static bump11ty(opts: { currentVersion: string; nextVersion: string }) {
    const root = this.getPluginPkgPath();
    const sitePath = path.join(root, "src", "utils", "site.ts");
    // "@dendronhq/dendron-11ty": "^1.53.0"
    const src = "^" + opts.currentVersion.replace(/^0./, "1.");
    const dst = "^" + opts.nextVersion.replace(/^0./, "1.");

    const newContent = fs
      .readFileSync(sitePath, { encoding: "utf8" })
      .replace(src, dst);
    fs.writeFileSync(sitePath, newContent);
    $("git add packages/plugin-core/src/utils/site.ts");
    $(`git commit -m "chore: bump 11ty"`);
  }

  static updatePkgMeta({
    pkgPath,
    name,
    description,
  }: {
    pkgPath: string;
    name: string;
    description: string;
  }) {
    const pkg = fs.readJSONSync(pkgPath) as PkgJson;
    pkg.name = name;
    pkg.displayName = name;
    pkg.description = description;
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
    const pkgPath = this.getPluginPkgPath();
    const { name, version } = await this.getPkgMeta({ pkgPath });
    const pkg = `${name}-${version}.vsix`;
    await $(
      `aws s3 cp $package s3://artifacts-prod-artifactb7980f61-19orqnnuurvwy/publish/$${pkg}`
    );
    console.log(
      `https://artifacts-prod-artifactb7980f61-19orqnnuurvwy.s3.amazonaws.com/publish/${pkg}`
    );
  }
}
