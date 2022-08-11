import fs, { Dirent } from "fs-extra";
import matter from "gray-matter";
import YAML from "js-yaml";
import _ from "lodash";
import os from "os";
import path from "path";
import {
  cleanName,
  DendronError,
  ERROR_SEVERITY,
  GetAllFilesOpts,
  globMatch,
  isNotNull,
  RespV2,
} from "@dendronhq/common-all";

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

/**
 *
 * @param fpath path of yaml file to read
 * @param overwriteDuplcate if set to true, will not throw duplicate entry exception and use the last entry.
 * @returns
 */
export function readYAML(fpath: string, overwriteDuplicate?: boolean): any {
  return YAML.load(fs.readFileSync(fpath, { encoding: "utf8" }), {
    schema: YAML.JSON_SCHEMA,
    json: overwriteDuplicate ?? false,
  });
}

export async function readYAMLAsync(fpath: string): Promise<any> {
  return YAML.load(await fs.readFile(fpath, { encoding: "utf8" }), {
    schema: YAML.JSON_SCHEMA,
  });
}

export function writeYAML(fpath: string, data: any) {
  const out = YAML.dump(data, { indent: 4, schema: YAML.JSON_SCHEMA });
  return fs.writeFileSync(fpath, out);
}

export function writeYAMLAsync(fpath: string, data: any) {
  const out = YAML.dump(data, { indent: 4, schema: YAML.JSON_SCHEMA });
  return fs.writeFile(fpath, out);
}

export function deleteFile(fpath: string) {
  return fs.unlinkSync(fpath);
}

/** Gets all files in `root`, with include and exclude lists (glob matched)
 *
 * This function returns the full `Dirent` which gives you access to file
 * metadata. If you don't need the metadata, see {@link getAllFiles}.
 *
 * @throws a `DendronError` with `ERROR_SEVERITY.MINOR`. This is to avoid
 * crashing the Dendron initialization, please catch the error and modify the
 * severity if needed.
 */
export async function getAllFilesWithTypes(
  opts: GetAllFilesOpts
): Promise<RespV2<Dirent[]>> {
  const { root } = _.defaults(opts, {
    exclude: [".git", "Icon\r", ".*"],
  });
  try {
    const allFiles = await fs.readdir(root.fsPath, { withFileTypes: true });
    return {
      data: allFiles
        .map((dirent) => {
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
          return dirent;
        })
        .filter(isNotNull),
      error: null,
    };
  } catch (err) {
    return {
      error: new DendronError({
        message: "Error when reading the vault",
        payload: err,
        // Marked as minor to avoid stopping initialization. Even if we can't read one vault, we might be able to read other vaults.
        severity: ERROR_SEVERITY.MINOR,
      }),
    };
  }
}

/** Gets all files in `root`, with include and exclude lists (glob matched)
 *
 * This function returns only the file name. If you need the file metadata, see
 * {@link getAllFilesWithTypes}.
 *
 * @throws a `DendronError` with `ERROR_SEVERITY.MINOR`. This is to avoid
 * crashing the Dendron initialization, please catch the error and modify the
 * severity if needed.
 */
export async function getAllFiles(
  opts: GetAllFilesOpts
): Promise<RespV2<string[]>> {
  const out = await getAllFilesWithTypes(opts);
  const data = out.data?.map((item) => item.name);
  return { error: out.error, data };
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
  if (
    filePath[0] === "~" &&
    (filePath[1] === path.sep || filePath.length === 1)
  ) {
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

// @deprecate, NoteUtils.normalizeFname
export function removeMDExtension(nodePath: string) {
  const idx = nodePath.lastIndexOf(".md");
  if (idx > 0) {
    nodePath = nodePath.slice(0, idx);
  }
  return nodePath;
}
