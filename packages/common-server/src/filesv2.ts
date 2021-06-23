import {
  DendronError,
  DNodeUtils,
  DVault,
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
import YAML from "js-yaml";
import _ from "lodash";
import path from "path";
// @ts-ignore
import tmp, { DirResult, dirSync } from "tmp";
import { resolvePath } from "./files";
import { SchemaParserV2 } from "./parser";
import SparkMD5 from "spark-md5";

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
  let didCreate = false;

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
  const schemaOpts = YAML.safeLoad(
    await fs.readFile(fpath, { encoding: "utf8" }),
    {
      schema: YAML.JSON_SCHEMA,
    }
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
  const schemaOpts = YAML.safeLoad(content, {
    schema: YAML.JSON_SCHEMA,
  }) as SchemaModuleOpts;
  return await SchemaParserV2.parseRaw(schemaOpts, {
    root: vault,
    fname,
    wsRoot,
  });
}

export function string2Note({
  content,
  fname,
  vault,
}: {
  content: string;
  fname: string;
  vault: DVault;
}) {
  const options: any = {
    engines: {
      yaml: {
        parse: (s: string) => YAML.safeLoad(s, { schema: YAML.JSON_SCHEMA }),
        stringify: (s: string) =>
          YAML.safeDump(s, { schema: YAML.JSON_SCHEMA }),
      },
    },
  };
  const { data, content: body } = matter(content, options);
  const custom = DNodeUtils.getCustomProps(data);
  const note = DNodeUtils.create({
    ...data,
    custom,
    fname,
    body,
    type: "note",
    vault,
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
    let capture = content.match(/^---[\s\S]+?---/);
    if (capture) {
      let offset = capture[0].length;
      let body = content.slice(offset + 1);
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

export { tmp, DirResult };
