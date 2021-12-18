import {
  DendronError,
  DNodeUtils,
  DVault,
  isNotUndefined,
  NoteProps,
  NotesCache,
  NoteUtils,
  SchemaModuleOpts,
  SchemaModuleProps,
  SchemaUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { assign, parse, stringify } from "comment-json";
import { FSWatcher } from "fs";
import fs from "fs-extra";
import matter from "gray-matter";
import YAML from "yamljs";
import _ from "lodash";
import path from "path";
// @ts-ignore
import tmp, { DirResult, dirSync } from "tmp";
import { resolvePath } from "./files";
import { SchemaParserV2 } from "./parser";
import SparkMD5 from "spark-md5";
import anymatch from "anymatch";

/** Dendron should ignore any of these folders when watching or searching folders.
 *
 * These folders are unlikely to contain anything Dendron would like to find, so we can ignore them.
 *
 * Example usage:
 * ```ts
 * if (!anymatch(COMMON_FOLDER_IGNORES, folder)) {
 *   // Good folder!
 * }
 * ```
 */
export const COMMON_FOLDER_IGNORES: string[] = [
  "**/.*/**", // Any folder starting with .
  "**/node_modules/**", // nodejs
  "**/.git/**", // git
  "**/__pycache__/**", // python
];

type FileWatcherCb = {
  fpath: string;
};

type CreateFileWatcherOpts = {
  fpath: string;
  numTries?: number;
  onChange: (opts: FileWatcherCb) => Promise<any>;
  onCreate: (opts: FileWatcherCb) => Promise<any>;
};
type CreateFileWatcherResp = {
  watcher: FSWatcher;
  didCreate: boolean;
};

export async function createFileWatcher(
  opts: CreateFileWatcherOpts
): Promise<CreateFileWatcherResp> {
  const { numTries, fpath, onChange } = _.defaults(opts, {
    numTries: 5,
  });
  const didCreate = false;

  return new Promise(async (resolve, _reject) => {
    if (!fs.existsSync(fpath)) {
      return setTimeout(() => {
        resolve(
          _createFileWatcher({
            ...opts,
            numTries: numTries - 1,
            isCreate: true,
          })
        );
      }, 3000);
    }
    const watcher = fs.watch(fpath, () => {
      onChange({ fpath });
    });
    return resolve({ watcher, didCreate });
  });
}

async function _createFileWatcher(
  opts: CreateFileWatcherOpts & { isCreate: boolean }
): Promise<CreateFileWatcherResp> {
  const { numTries, fpath, onChange, onCreate } = _.defaults(opts, {
    numTries: 5,
  });
  if (numTries <= 0) {
    throw new DendronError({ message: "exceeded numTries" });
  }
  return new Promise(async (resolve, _reject) => {
    if (!fs.existsSync(fpath)) {
      console.log({ fpath, msg: "not exist" });
      return setTimeout(() => {
        resolve(createFileWatcher({ ...opts, numTries: numTries - 1 }));
      }, 3000);
    }
    await onCreate({ fpath });
    const watcher = fs.watch(fpath, () => {
      onChange({ fpath });
    });
    return resolve({ watcher, didCreate: true });
  });
}

export async function file2Schema(
  fpath: string,
  wsRoot: string
): Promise<SchemaModuleProps> {
  const root = { fsPath: path.dirname(fpath) };
  const fname = path.basename(fpath, ".schema.yml");
  const schemaOpts = YAML.parse(
    await fs.readFile(fpath, { encoding: "utf8" })
  ) as SchemaModuleOpts;
  return await SchemaParserV2.parseRaw(schemaOpts, { root, fname, wsRoot });
}

export function genHash(contents: any) {
  return SparkMD5.hash(contents); // OR raw hash (binary string)
}

export async function string2Schema({
  vault,
  content,
  fname,
  wsRoot,
}: {
  vault: DVault;
  content: string;
  fname: string;
  wsRoot: string;
}) {
  const schemaOpts = YAML.parse(content) as SchemaModuleOpts;
  return await SchemaParserV2.parseRaw(schemaOpts, {
    root: vault,
    fname,
    wsRoot,
  });
}

/**
 *
 * @param calculateHash - when set, add `contentHash` property to the note
 *  Default: false
 * @returns
 */
export function string2Note({
  content,
  fname,
  vault,
  calculateHash,
}: {
  content: string;
  fname: string;
  vault: DVault;
  calculateHash?: boolean;
}) {
  const options: any = {
    engines: {
      yaml: {
        parse: (s: string) => YAML.parse(s),
        stringify: (s: string) => YAML.stringify(s),
      },
    },
  };
  const { data, content: body } = matter(content, options);
  const custom = DNodeUtils.getCustomProps(data);

  const contentHash = calculateHash ? genHash(content) : undefined;
  const note = DNodeUtils.create({
    ...data,
    custom,
    fname,
    body,
    type: "note",
    vault,
    contentHash,
  });
  return note;
}

export function file2Note(
  fpath: string,
  vault: DVault,
  toLowercase?: boolean
): NoteProps {
  const content = fs.readFileSync(fpath, { encoding: "utf8" });
  const { name } = path.parse(fpath);
  const fname = toLowercase ? name.toLowerCase() : name;
  return string2Note({ content, fname, vault });
}

export function file2NoteWithCache({
  fpath,
  vault,
  cache,
  toLowercase,
}: {
  fpath: string;
  vault: DVault;
  cache: NotesCache;
  toLowercase?: boolean;
}): { note: NoteProps; matchHash: boolean; noteHash: string } {
  const content = fs.readFileSync(fpath, { encoding: "utf8" });
  const { name } = path.parse(fpath);
  const sig = genHash(content);
  const matchHash = cache.notes[name]?.hash === sig;
  const fname = toLowercase ? name.toLowerCase() : name;
  let note: NoteProps;

  // if hash matches, note hasn't changed
  if (matchHash) {
    // since we don't store the note body in the cache file, we need to re-parse the body
    const capture = content.match(/^---[\s\S]+?---/);
    if (capture) {
      const offset = capture[0].length;
      const body = content.slice(offset + 1);
      // vault can change without note changing so we need to add this
      // add `contentHash` to this signature because its not saved with note
      note = { ...cache.notes[name].data, body, vault, contentHash: sig };
      return { note, matchHash, noteHash: sig };
    }
  }
  note = string2Note({ content, fname, vault });
  note.contentHash = sig;
  return { note, matchHash, noteHash: sig };
}

/** Read the contents of a note from the filesystem.
 *
 * Warning! The note contents may be out of date compared to changes in the editor.
 * Consider using `NoteUtils.serialize` instead.
 */
export function note2String(opts: {
  note: NoteProps;
  wsRoot: string;
}): Promise<string> {
  const notePath = NoteUtils.getFullPath(opts);
  return fs.readFile(notePath, { encoding: "utf8" });
}

/**
 * Go to dirname that {fname} is contained in
 * @param maxLvl? - default: 10
 @deprecated use {@link findUpTo}
 */
export function goUpTo(opts: {
  base: string;
  fname: string;
  maxLvl?: number;
}): string {
  let { fname, base, maxLvl } = _.defaults(opts, { maxLvl: 10 });
  const lvls = [];
  while (maxLvl > 0) {
    const tryPath = path.join(base, ...lvls, fname);
    if (fs.existsSync(tryPath)) {
      return path.dirname(tryPath);
    }
    maxLvl -= 1;
    lvls.push("..");
  }
  throw Error(`no root found from ${base}`);
}

/**
 * Go to dirname that {fname} is contained in, going out (up the tree) from base.
 * @param maxLvl - default: 3
 * @param returnDirPath - return path to directory, default: false
 */
export function findUpTo(opts: {
  base: string;
  fname: string;
  maxLvl?: number;
  returnDirPath?: boolean;
}): string | undefined {
  const { fname, base, maxLvl, returnDirPath } = _.defaults(opts, {
    maxLvl: 3,
    returnDirPath: false,
  });
  const lvls = [];
  let acc = 0;
  while (maxLvl - acc > 0) {
    const tryPath = path.join(base, ...lvls, fname);
    if (fs.existsSync(tryPath)) {
      return returnDirPath ? path.dirname(tryPath) : tryPath;
    }
    acc += 1;
    lvls.push("..");
  }
  return undefined;
}

export const WS_FILE_MAX_SEARCH_DEPTH = 3;

/**
 * Go to dirname that {fname} is contained in, going in (deeper into tree) from base.
 * @param maxLvl Default 3, how deep to go down in the file tree. Keep in mind that the tree gets wider and this search becomes exponentially more expensive the deeper we go.
 * @param returnDirPath - return path to directory, default: false
 *
 * One warning: this will not search into folders starting with `.` to avoid searching through things like the `.git` folder.
 */
export async function findDownTo(opts: {
  base: string;
  fname: string;
  maxLvl?: number;
  returnDirPath?: boolean;
}): Promise<string | undefined> {
  const { fname, base, maxLvl, returnDirPath } = {
    maxLvl: WS_FILE_MAX_SEARCH_DEPTH,
    returnDirPath: false,
    ...opts,
  };
  const contents = await fs.readdir(base);
  let found = contents.filter((foundFile) => foundFile === fname)[0];
  if (found) {
    found = path.join(base, found);
    return returnDirPath ? path.dirname(found) : found;
  }
  if (maxLvl > 1) {
    // Keep searching recursively
    return (
      await Promise.all(
        contents.map(async (folder) => {
          // Find the folders in the current folder
          const subfolder = await fs.stat(path.join(base, folder));
          if (!subfolder.isDirectory()) return;
          // Exclude folders starting with . to skip stuff like `.git`
          if (anymatch(COMMON_FOLDER_IGNORES, folder)) return;
          return findDownTo({
            ...opts,
            base: path.join(base, folder),
            maxLvl: maxLvl - 1,
          });
        })
      )
    ).filter(isNotUndefined)[0];
  }
  return undefined;
}

/** Returns true if `inner` is inside of `outer`, and false otherwise.
 *
 * If `inner === outer`, then that also returns false.
 */
export function isInsidePath(outer: string, inner: string) {
  // When going from `outer` to `inner`
  const relPath = path.relative(outer, inner);
  // If we have to leave `outer`, or if we have to switch to a
  // different drive with an absolute path, then `inner` can't be
  // inside `outer` (or `inner` and `outer` are identical)
  return (
    !relPath.startsWith("..") && !path.isAbsolute(relPath) && relPath !== ""
  );
}

/** Returns the list of unique, outermost folders. No two folders returned are nested within each other. */
export function uniqueOutermostFolders(folders: string[]) {
  // Avoid duplicates
  folders = _.uniq(folders);
  if (folders.length === 1) return folders;
  return folders.filter((currentFolder) =>
    folders.every((otherFolder) => {
      // `currentFolder` is not inside any other folder
      return !isInsidePath(otherFolder, currentFolder);
    })
  );
}

export function note2File({
  note,
  vault,
  wsRoot,
  opts,
}: {
  note: NoteProps;
  vault: DVault;
  wsRoot: string;
  opts?: { writeHierarchy?: boolean };
}) {
  const { fname } = note;
  const ext = ".md";
  const payload = NoteUtils.serialize(note, opts);
  const vpath = vault2Path({ vault, wsRoot });
  return fs.writeFile(path.join(vpath, fname + ext), payload);
}

export function schemaModuleOpts2File(
  schemaFile: SchemaModuleOpts,
  vaultPath: string,
  fname: string
) {
  const ext = ".schema.yml";
  return fs.writeFile(
    path.join(vaultPath, fname + ext),
    SchemaUtils.serializeModuleOpts(schemaFile)
  );
}

export function schemaModuleProps2File(
  schemaMProps: SchemaModuleProps,
  vpath: string,
  fname: string
) {
  const ext = ".schema.yml";
  return fs.writeFile(
    path.join(vpath, fname + ext),
    SchemaUtils.serializeModuleProps(schemaMProps)
  );
}

export function assignJSONWithComment(jsonObj: any, dataToAdd: any) {
  return assign(
    {
      ...dataToAdd,
    },
    jsonObj
  );
}

export async function readJSONWithComments(fpath: string) {
  const content = await fs.readFile(fpath);
  const obj = parse(content.toString());
  return obj;
}

export function readJSONWithCommentsSync(fpath: string) {
  const content = fs.readFileSync(fpath);
  const obj = parse(content.toString());
  return obj;
}

export function tmpDir(): DirResult {
  const dirPath = dirSync();
  return dirPath;
}

export const vault2Path = ({
  vault,
  wsRoot,
}: {
  vault: DVault;
  wsRoot: string;
}) => {
  return resolvePath(VaultUtils.getRelPath(vault), wsRoot);
};

export function writeJSONWithComments(fpath: string, data: any) {
  const payload = stringify(data, null, 4);
  return fs.writeFileSync(fpath, payload);
}

/**
 * Turn . delimited file to / separated
 */
export function dot2Slash(fname: string) {
  return fname.replace(/\./g, "/");
}

/** Checks that the `path` contains a file. */
export async function fileExists(path: string) {
  try {
    const stat = await fs.stat(path);
    return stat.isFile();
  } catch {
    return false;
  }
}

/** Finds if a file `fpath` is located in any vault.
 *
 * @param fpath A file name or relative path that we are searching inside vaults.
 */
async function findFileInVault({
  fpath,
  wsRoot,
  vaults,
}: {
  fpath: string;
  wsRoot: string;
  vaults: DVault[];
}): Promise<{ vault: DVault; fullPath: string } | undefined> {
  // Assets from later vaults will overwrite earlier ones.
  vaults = [...vaults].reverse();
  for (const vault of vaults) {
    const fullPath = path.join(wsRoot, VaultUtils.getRelPath(vault), fpath);
    // Doing this sequentially to simulate how publishing handles conflicting assets.
    // eslint-disable-next-line no-await-in-loop
    if (await fileExists(fullPath)) {
      return { vault, fullPath };
    }
  }
  return;
}

export async function findNonNoteFile(opts: {
  fpath: string;
  wsRoot: string;
  vaults: DVault[];
}): Promise<{ vault?: DVault; fullPath: string } | undefined> {
  let { fpath } = opts;
  // Especially for assets, `/assets` and `assets` refers to the same place.
  fpath = _.trim(fpath, "/\\");
  // Check if this is an asset first
  if (fpath.startsWith("assets")) {
    const out = await findFileInVault(opts);
    if (out !== undefined) return out;
  }
  // If not an asset, or if we couldn't find it in assets, then check from wsRoot for out-of-vault files
  const fullPath = path.join(opts.wsRoot, fpath);
  if (await fileExists(fullPath)) return { fullPath };
  // Otherwise, it just doesn't exist
  return undefined;
}

export { tmp, DirResult };
