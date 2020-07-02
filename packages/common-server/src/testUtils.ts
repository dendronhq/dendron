import fs from "fs-extra";
import { genUUID } from "@dendronhq/common-all";
import _ from "lodash";
import YAML from "yamljs";
import path from "path";
import matter from "gray-matter";

export function appendUUID(fname: string) {
  return `${fname}-${genUUID()}`;
}

export class EngineTestUtils {
  static setupStoreDir(fixturesDir: string, storeDir: string) {
    const dirPath = appendUUID(storeDir);
    // eslint-disable-next-line no-undef
    fs.ensureDirSync(dirPath);
    fs.emptyDirSync(dirPath);
    fs.copySync(fixturesDir, dirPath);
    return dirPath;
  }
}

export class FileTestUtils {
  static cmpFiles = (
    root: string,
    expected: string[],
    opts?: { add?: string[], remove?: string[] }
  ) => {
    const cleanOpts = _.defaults(opts, { add: [], remove: [] });
    const dirEnts = fs.readdirSync(root);
    return [
      dirEnts.sort(),
      expected.concat(cleanOpts.add).filter(ent => {
        return !_.includes(cleanOpts?.remove, ent);
      }).sort()
    ];
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

  static tmpDir(base: string) {
    const dirPath = appendUUID(base);
    fs.ensureDirSync(dirPath);
    fs.emptyDirSync(dirPath);
    return dirPath;
  }

  static readYMLFile = (root: string, fname: string) => {
    return YAML.load(path.join(root, fname));
  }

  static writeMDFile = (root: string, fname: string, fm: any, body: string) => {
    const fmAndBody = matter.stringify(body, fm);
    return fs.writeFileSync(path.join(root, fname), fmAndBody);
  };
}

export class LernaTestUtils {
  static getRootDir() {
    return FileTestUtils.getPkgRoot(__dirname, "lerna.json");
  }
  static getFixturesDir() {
    return path.join(this.getRootDir(), "fixtures");
  }
}
