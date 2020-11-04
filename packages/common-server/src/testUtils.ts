import fs from "fs-extra";
import matter from "gray-matter";
import _ from "lodash";
import path from "path";
import tmp, { DirResult } from "tmp";
import { readYAML } from "./files";
export { DirResult };
// eslint-disable-next-line no-undef

tmp.setGracefulCleanup();

export type FileItem = {
  path: string;
  body?: string;
};

export class FileTestUtils {
  /**
   * Compare files in root with expected
   * @param root
   * @param expected
   * @param opts
   */
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

  static async createFiles(root: string, files: FileItem[]) {
    return Promise.all(
      _.map(files, async (ent) => {
        const fpath = path.join(root, ent.path);
        await fs.ensureFile(fpath);
        if (ent.body) {
          fs.writeFileSync(fpath, ent.body, { encoding: "utf8" });
        }
      })
    );
  }

  static getPkgRoot(base: string, fname?: string): string {
    fname = fname || "package.json";
    let acc = 10;
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
