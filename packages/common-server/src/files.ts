import { NoteRawProps } from "@dendronhq/common-all";
import fs, { Dirent } from "fs";
import matter from "gray-matter";
import YAML from "js-yaml";
import _ from "lodash";
import minimatch from "minimatch";
import os from "os";
import path from "path";
import tmp, { DirResult } from "tmp";

export type getAllFilesOpts = {
  root: string;
  include?: string[];
  exclude?: string[];
  withFileTypes?: boolean;
};

/**
 * Make name safe for dendron
 * @param name
 * @param opts
 */
export function cleanName(name: string): string {
  name = name.replace(/\//g, ".").toLocaleLowerCase();
  name = name.replace(/ /g, "-");
  return name;
}

/**
 *
 * Normalize file name
 * - strip off extension
 * - replace [.\s] with -
 * @param name
 * @param opts
 *   - isDir: dealing with directory
 */
export function cleanFileName(
  name: string,
  opts?: { isDir?: boolean }
): string {
  const cleanOpts = _.defaults(opts, { isDir: false });
  if (!cleanOpts.isDir) {
    const { name: fname, dir } = path.parse(name);
    // strip off extension
    name = path.join(dir, fname);
  }
  name = name.replace(/\./g, "-");
  // replace all names already in file name
  //name = name.replace(/\./g, "-");
  name = cleanName(name);
  // if file, only get name (no extension)
  return name;
}

export function findInParent(base: string, fname: string): string | undefined {
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
  return;
}

export function readMD(fpath: string): { data: any; content: string } {
  return matter.read(fpath, {});
}

export function readYAML(fpath: string): any {
  return YAML.safeLoad(fs.readFileSync(fpath, { encoding: "utf8" }), {
    schema: YAML.JSON_SCHEMA,
  });
}

export function writeYAML(fpath: string, data: any) {
  const out = YAML.safeDump(data, { indent: 4, schema: YAML.JSON_SCHEMA });
  return fs.writeFileSync(fpath, out);
}

export function deleteFile(fpath: string) {
  return fs.unlinkSync(fpath);
}

export function globMatch(patterns: string[] | string, fname: string): boolean {
  if (_.isString(patterns)) {
    return minimatch(fname, patterns);
  }
  return _.some(patterns, (pattern) => minimatch(fname, pattern));
}

export function getAllFiles(opts: getAllFilesOpts): Dirent[] | string[] {
  const { root, withFileTypes } = _.defaults(opts, {
    exclude: [".git", "Icon\r", ".*"],
    withFileTypes: false,
  });
  const allFiles = fs.readdirSync(root, { withFileTypes: true });
  return _.reject(
    allFiles.map((dirent) => {
      const { name: fname } = dirent;
      // match exclusions
      if (
        _.some([dirent.isDirectory(), globMatch(opts.exclude || [], fname)])
      ) {
        return null;
      }
      // match inclusion
      if (opts.include && !globMatch(opts.include, fname)) {
        return null;
      }
      if (withFileTypes) {
        return dirent;
      } else {
        return dirent.name;
      }
    }),
    _.isNull
  ) as Dirent[] | string[];
}

export function node2PropsMdFile(props: NoteRawProps, opts: { root: string }) {
  const { root } = opts;
  const { body, fname, custom } = props;
  const filePath = path.join(root, `${fname}.md`);
  const blacklist = [
    "body",
    "stub",
    "data",
    "custom",
    "fname",
    "parent",
    "children",
  ];
  return fs.writeFileSync(
    filePath,
    matter.stringify(body || "", { ..._.omit(props, blacklist), ...custom })
  );
}

/**
 * Convert a node to a MD File. Any custom attributes will be
 * added to the end
 *
 * @param node: node to convert
 * @param opts
 *   - root: root folder where files should be written to
 */
export function resolveTilde(filePath: string) {
  if (!filePath || typeof filePath !== "string") {
    return "";
  }
  // '~/folder/path' or '~'
  if (filePath[0] === "~" && (filePath[1] === "/" || filePath.length === 1)) {
    return filePath.replace("~", os.homedir());
  }
  return filePath;
}

/**
 * Resolve file path and resolve relative paths relative to `root`
 * @param filePath
 * @param root
 */
export function resolvePath(filePath: string, root?: string): string {
  const platform = os.platform();
  const isWin = platform === "win32";
  if (filePath[0] === "~") {
    return resolveTilde(filePath);
  } else if (
    path.isAbsolute(filePath) ||
    (isWin && filePath.startsWith("\\"))
  ) {
    return filePath;
  } else {
    if (!root) {
      throw Error("can't use rel path without a workspace root set");
    }
    return path.join(root, filePath);
  }
}

export function removeMDExtension(nodePath: string) {
  const idx = nodePath.lastIndexOf(".md");
  if (idx > 0) {
    nodePath = nodePath.slice(0, idx);
  }
  return nodePath;
}

export function tmpDir(): DirResult {
  const dirPath = tmp.dirSync();
  return dirPath;
}
