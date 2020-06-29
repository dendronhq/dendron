import fs from "fs-extra";
import { genUUID } from "@dendronhq/common-all";
import _ from "lodash";
import YAML from "yamljs";
import path from "path";
import matter from "gray-matter";

export function appendUUID(fname: string) {
  return `${fname}-${genUUID()}`;
}

export function setupTmpDendronDir(opts: {
  fixturesDir: string;
  tmpDir: string;
}): string {
  const dirPath = appendUUID(opts.tmpDir);
  // eslint-disable-next-line no-undef
  fs.ensureDirSync(dirPath);
  fs.emptyDirSync(dirPath);
  fs.copySync(opts.fixturesDir, dirPath);
  return dirPath;
}

export class FileTestUtils {
  static cmpFiles = (
    root: string,
    expected: string[],
    opts?: { additions?: string[] }
  ) => {
    const cleanOpts = _.defaults(opts, { additions: [] });
    const dirEnts = fs.readdirSync(root);
    return [
      dirEnts.sort(),
      expected.concat(_.map(cleanOpts.additions, (ent) => `${ent}.md`)).sort()
    ];
  }

  static readYMLFile = (root: string, fname: string) => {
    return YAML.load(path.join(root, fname));
  }

  static writeMDFile = (root: string, fname: string, fm: any, body: string) => {
    const fmAndBody = matter.stringify(body, fm);
    return fs.writeFileSync(path.join(root, fname), fmAndBody);
  };
}

export const testUtils = {
  setupTmpDendronDir,
};
