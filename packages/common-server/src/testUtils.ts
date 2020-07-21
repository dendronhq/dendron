import fs from "fs-extra";
import { genUUID } from "@dendronhq/common-all";
import _ from "lodash";
import YAML from "yamljs";
import path, { posix } from "path";
import matter from "gray-matter";

export function appendUUID(fname: string) {
  return `${fname}-${genUUID()}`;
}

export class EngineTestUtils {
  static setupStoreDir(
    fixturesDir: string,
    storeDir: string,
    opts?: { copyFixtures?: boolean }
  ) {
    const cleanOpts = _.defaults(opts, { copyFixtures: true });
    const dirPath = appendUUID(storeDir);
    // eslint-disable-next-line no-undef
    fs.ensureDirSync(dirPath);
    fs.emptyDirSync(dirPath);
    if (cleanOpts.copyFixtures) {
      fs.copySync(fixturesDir, dirPath);
    }
    return dirPath;
  }
}

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
    return posix.join(pkgRoot, "fixtures");
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

  static tmpDir(base: string, skipCreate?: boolean) {
    const dirPath = appendUUID(base);
    if (!skipCreate) {
      fs.ensureDirSync(dirPath);
      fs.emptyDirSync(dirPath);
    }
    return dirPath;
  }

  static readMDFile = (root: string, fname: string) => {
    return matter.read(path.join(root, fname));
  };

  static readYMLFile = (root: string, fname: string) => {
    return YAML.load(path.join(root, fname));
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
  static getFixturesDir(type?: "store") {
    const pathSoFar = path.join(this.getRootDir(), "fixtures");
    return type ? path.join(pathSoFar, type) : pathSoFar;
  }
  static fixtureFilesForStore() {
    return fs.readdirSync(path.join(LernaTestUtils.getFixturesDir(), "store"));
  }
}
