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
// @ts-ignore
import tmp, { DirResult, dirSync, setGracefulCleanup } from "tmp";
import { resolvePath } from "./files";
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

/**
 * Go to dirname that {fname} is contained in
 */
export function goUpTo(base: string, fname?: string): string {
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

export function note2File({
  note,
  vault,
  wsRoot,
  opts,
}: {
  note: NotePropsV2;
  vault: DVault;
  wsRoot: string;
  opts?: { writeHierarchy?: boolean };
}) {
  const { fname } = note;
  const ext = ".md";
  const payload = NoteUtilsV2.serialize(note, opts);
  const vpath = vault2Path({ vault, wsRoot });
  return fs.writeFile(path.join(vpath, fname + ext), payload);
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
  vpath: string,
  fname: string
) {
  const ext = ".schema.yml";
  return fs.writeFile(
    path.join(vpath, fname + ext),
    SchemaUtilsV2.serializeModuleProps(schemaMProps)
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
  return resolvePath(vault.fsPath, wsRoot);
};

export function writeJSONWithComments(fpath: string, data: any) {
  const payload = stringify(data, null, 4);
  return fs.writeFileSync(fpath, payload);
}

export { tmp, DirResult };

// @deprecated - use VaultUtils in common-all
export class VaultUtils {
  static getName(vault: DVault): string {
    return vault.name || path.basename(vault.fsPath);
  }

  static isEqual(vaultSrc: DVault, vaultCmp: DVault, wsRoot: string) {
    return (
      this.normVaultPath({ vault: vaultSrc, wsRoot }) ===
      this.normVaultPath({ vault: vaultCmp, wsRoot })
    );
  }

  static getByVaultPath({
    wsRoot,
    vaults,
    vaultPath,
  }: {
    wsRoot: string;
    vaultPath: string;
    vaults: DVault[];
  }) {
    // get diname
    const vault = _.find(vaults, (ent) => {
      let cmp = path.isAbsolute(vaultPath)
        ? path.relative(wsRoot, vaultPath)
        : vaultPath;
      return ent.fsPath === cmp;
    });
    if (!vault) {
      throw new DendronError({ msg: "no vault found" });
    }
    return vault;
  }

  static getVaultByNotePathV4({
    vaults,
    fsPath,
  }: {
    /**
     * Path to note
     */
    fsPath: string;
    wsRoot: string;
    vaults: DVault[];
  }) {
    // get diname
    fsPath = path.dirname(fsPath);
    const vault = _.find(vaults, { fsPath });
    if (!vault) {
      throw new DendronError({ msg: "no vault found" });
    }
    return vault;
  }

  static normVaultPath = (opts: { vault: DVault; wsRoot: string }) => {
    return path.isAbsolute(opts.vault.fsPath)
      ? path.relative(opts.wsRoot, opts.vault.fsPath)
      : opts.vault.fsPath;
  };
}
