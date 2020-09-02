import fs from "fs-extra";
import matter from "gray-matter";
import _ from "lodash";
import path from "path";
import tmp, { DirResult } from "tmp";
import { readYAML } from "./files";

export { DirResult };
// eslint-disable-next-line no-undef

tmp.setGracefulCleanup();

export class FileTestUtils {
  static cmpFiles = (
    root: string,
    expected: string[],
    opts?: { add?: string[]; remove?: string[]; ignore?: string[] }
  ) => {
    const cleanOpts = _.defaults(opts, { add: [], remove: [], ignore: [] });
    const dirEnts = fs
      .readdirSync(root)
      .filter((ent) => !_.includes(cleanOpts.ignore, ent));
    return [
      dirEnts.sort(),
      expected
        .concat(cleanOpts.add)
        .filter((ent) => {
          return !_.includes(cleanOpts?.remove, ent);
        })
        .sort(),
    ];
  };

  static getFixturesRoot(base: string) {
    const pkgRoot = FileTestUtils.getPkgRoot(base);
    return path.join(pkgRoot, "fixtures");
  }

  static getPkgRoot(base: string, fname?: string): string {
    fname = fname || "package.json";
    let acc = 5;
    const lvls = [];
    while (acc > 0) {
      const tryPath = path.join(base, ...lvls, fname);
      if (fs.existsSync(tryPath)) {
        return path.dirname(tryPath);
      }
      acc -= 1;
      lvls.push("..");
    }
    throw Error(`no root found from ${base}`);
  }

  static setupDir(from: string, to: string) {
    fs.copySync(from, to);
  }

  static tmpDir(): DirResult {
    const dirPath = tmp.dirSync();
    return dirPath;
  }

  static readMDFile = (root: string, fname: string) => {
    return matter.read(path.join(root, fname));
  };

  static readYMLFile = (root: string, fname: string) => {
    return readYAML(path.join(root, fname));
  };

  static writeMDFile = (root: string, fname: string, fm: any, body: string) => {
    const fmAndBody = matter.stringify(body, fm);
    return fs.writeFileSync(path.join(root, fname), fmAndBody);
  };
}

export class LernaTestUtils {
  static getRootDir() {
    return FileTestUtils.getPkgRoot(__dirname, "lerna.json");
  }
  static getFixturesDir(type?: string) {
    const pathSoFar = path.join(this.getRootDir(), "fixtures");
    return type ? path.join(pathSoFar, type) : pathSoFar;
  }
  static fixtureFilesForStore() {
    return fs.readdirSync(path.join(LernaTestUtils.getFixturesDir(), "store"));
  }
}

export type DendronVaultOpts = {
  /**
   * Destination. Default: create a tmp directory
   */
  root?: string;
  /**
   * Fixture to copy from. Default: 'store'
   */
  fixtureDir?: string;
  /**
   * Copy fixtures. Default: true
   */
  copyFixtures?: boolean;
};

export class EngineTestUtils {
  /**
   * setupStoreDir
   */
  static setupStoreDir(opts?: {
    storeDirSrc?: string;
    storeDstPath?: string;
    copyFixtures?: boolean;
    initDirCb?: (dirPath: string) => void;
  }) {
    const cleanOpts = _.defaults(opts, {
      storeDirSrc: "store",
      copyFixtures: true,
    });
    let { storeDirSrc, storeDstPath, copyFixtures } = cleanOpts;
    const fixturesSrcPath = LernaTestUtils.getFixturesDir(storeDirSrc);
    if (_.isUndefined(storeDstPath)) {
      storeDstPath = FileTestUtils.tmpDir().name;
    }
    if (copyFixtures) {
      fs.copySync(fixturesSrcPath, storeDstPath);
    }
    if (opts?.initDirCb) {
      opts.initDirCb(storeDstPath);
    }
    return storeDstPath;
  }
}
