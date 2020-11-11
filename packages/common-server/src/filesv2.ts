import {
  DendronError,
  DNodeUtilsV2,
  DVault,
  NotePropsV2,
  NoteUtilsV2,
  SchemaModuleOptsV2,
  SchemaModulePropsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import { assign, parse, stringify } from "comment-json";
import { FSWatcher } from "fs";
import fs from "fs-extra";
import matter from "gray-matter";
import YAML from "js-yaml";
import _ from "lodash";
import path from "path";
import tmp, { DirResult } from "tmp";
import { SchemaParserV2 } from "./parser";

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
    throw new DendronError({ msg: "exceeded numTries" });
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

export function file2Schema(fpath: string): SchemaModulePropsV2 {
  const root = { fsPath: path.dirname(fpath) };
  const fname = path.basename(fpath, ".schema.yml");
  const schemaOpts = YAML.safeLoad(
    fs.readFileSync(fpath, { encoding: "utf8" }),
    {
      schema: YAML.JSON_SCHEMA,
    }
  ) as SchemaModuleOptsV2;
  return SchemaParserV2.parseRaw(schemaOpts, { root, fname });
}
export function string2Schema({
  vault,
  content,
  fname,
}: {
  vault: DVault;
  content: string;
  fname: string;
}) {
  const schemaOpts = YAML.safeLoad(content, {
    schema: YAML.JSON_SCHEMA,
  }) as SchemaModuleOptsV2;
  return SchemaParserV2.parseRaw(schemaOpts, { root: vault, fname });
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
  const custom = DNodeUtilsV2.getCustomProps(data);
  const note = DNodeUtilsV2.create({
    ...data,
    custom,
    fname,
    body,
    type: "note",
    vault,
  });
  return note;
}

export function file2Note(fpath: string, vault: DVault): NotePropsV2 {
  const content = fs.readFileSync(fpath, { encoding: "utf8" });
  const { name: fname } = path.parse(fpath);
  return string2Note({ content, fname, vault });
}

export function getPkgRoot(base: string, fname?: string): string {
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

export function note2File(
  note: NotePropsV2,
  vaultPath: string,
  opts?: { writeHierarchy?: boolean }
) {
  const { fname } = note;
  const ext = ".md";
  const payload = NoteUtilsV2.serialize(note, opts);
  return fs.writeFile(path.join(vaultPath, fname + ext), payload);
}

export function schemaModuleOpts2File(
  schemaFile: SchemaModuleOptsV2,
  vaultPath: string,
  fname: string
) {
  const ext = ".schema.yml";
  return fs.writeFile(
    path.join(vaultPath, fname + ext),
    SchemaUtilsV2.serializeModuleOpts(schemaFile)
  );
}

export function schemaModuleProps2File(
  schemaMProps: SchemaModulePropsV2,
  vaultPath: string,
  fname: string
) {
  const ext = ".schema.yml";
  return fs.writeFile(
    path.join(vaultPath, fname + ext),
    SchemaUtilsV2.serializeModuleProps(schemaMProps)
  );
}

export function assignJSONWithComment(obj: any, data: any) {
  return assign(
    {
      ...data,
    },
    obj
  );
}

export async function readJSONWithComments(fpath: string) {
  const content = await fs.readFile(fpath);
  const obj = parse(content.toString());
  return obj;
}

export function tmpDir(): DirResult {
  const dirPath = tmp.dirSync();
  return dirPath;
}

export function writeJSONWithComments(fpath: string, data: any) {
  const payload = stringify(data, null, 4);
  return fs.writeFile(fpath, payload);
}

export { tmp, DirResult };
