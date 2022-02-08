/* eslint-disable no-useless-escape */
import {
  DNodeUtils,
  DVault,
  NoteOpts,
  NoteProps,
  NotePropsDict,
  NoteUtils,
  SchemaModuleOpts,
  SchemaModuleProps,
  SchemaProps,
  SchemaUtils,
  WorkspaceOpts,
  WorkspaceVault,
} from "@dendronhq/common-all";
import {
  note2File,
  resolvePath,
  schemaModuleOpts2File,
  schemaModuleProps2File,
  tmpDir,
  vault2Path,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { PreSetupHookFunctionV4 } from "./types";
import { AssertUtils } from "./utils";

export * from "./fileUtils";
export * from "./noteUtils";
export * from "./presets";
export * from "./types";
export * from "./utils";
export * from "./utilsv2";
export { AssertUtils };

export function filterDotFiles(filenames: string[]) {
  return filenames.filter((filename) => !/(^|\/)\.[^\/\.]/g.test(filename));
}

export function getLogFilePath(_name: string) {
  // Placing these in the system temp directory proved difficult, as we both
  // want to generate paths here and pass them from npm in the various LOG_DST
  // environment variables. There's no consistent environment variable we can
  // use for this:
  //
  // * TMPDIR is set for some POSIX-likes, e.g. macOS, but not Linux.
  // * TEMP is set on Windows.
  // @ts-ignore
  //const rootDir = path.dirname(path.dirname(path.dirname(__dirname)));
  //return path.join(rootDir, "logs", `${name}.log`);
  return "stdout";
}

type InitVaultFunc = (vaultPath: string) => void;
export type SetupVaultOpts = {
  vaultDir?: string;
  initDirCb?: (vaultPath: string) => void;
  withAssets?: boolean;
  withGit?: boolean;
};
export type SetupWSOpts = {
  initDirCb?: (vaultPath: string) => void;
  withAssets?: boolean;
  withGit?: boolean;
  wsRoot?: string;
  vaultDir?: string;
};

type SetupVaultsOptsV3 = Omit<SetupVaultOpts, "initDirCb"> & {
  wsRoot: string;
  vaults?: DVault[];
  initVault1?: InitVaultFunc;
  initVault2?: InitVaultFunc;
};

type SetupWSOptsV3 = Omit<SetupVaultsOptsV3, "wsRoot"> & { wsRoot?: string };

/**
 * Relative vaults
 */

export type SetupVaultsOptsV4 = {
  preSetupHook?: PreSetupHookFunctionV4;
  vault: DVault;
};

export class EngineTestUtilsV4 {
  /**
   * Setup a workspace with three vaults
   * The third vault has a different path than name
   */
  static async setupWS(
    opts?: { wsRoot?: string } & {
      setupVaultsOpts?: SetupVaultsOptsV4[];
      singleVault?: boolean;
    }
  ): Promise<WorkspaceOpts> {
    const wsRoot = opts?.wsRoot || tmpDir().name;
    const defaultVaults = opts?.singleVault
      ? ["vault1"]
      : ["vault1", "vault2", "vault3"];
    const setupVaultsOpts: SetupVaultsOptsV4[] =
      opts?.setupVaultsOpts ||
      defaultVaults.map((ent) => ({
        vault: {
          fsPath: ent,
          name: ent === "vault3" ? "vaultThree" : undefined,
        },
        preSetupHook: async ({ vpath, vault, wsRoot }) => {
          const rootModule = SchemaUtils.createRootModule({
            created: 1,
            updated: 1,
            vault,
          });
          await schemaModuleOpts2File(rootModule, vpath, "root");

          const rootNote = await NoteUtils.createRoot({
            created: 1,
            updated: 1,
            vault,
          });
          await note2File({ note: rootNote, vault, wsRoot });
        },
      }));

    const vaults = await Promise.all(
      setupVaultsOpts.flatMap((ent) => {
        return this.setupVault({ ...ent, wsRoot });
      })
    );
    vaults.map((ent) => {
      if (_.isUndefined(ent.name)) {
        delete ent.name;
      }
    });
    return { wsRoot, vaults };
  }

  static async setupVault(opts: SetupVaultsOptsV4 & { wsRoot: string }) {
    const { wsRoot, vault } = opts;
    const vpath = resolvePath(vault.fsPath, wsRoot);
    fs.ensureDirSync(vpath);
    if (opts.preSetupHook) {
      await opts.preSetupHook({ wsRoot, vault, vpath });
    }
    return opts.vault;
  }

  /**
   * Check disk for note
   * @param opts
   * @returns
   */
  static checkVault(
    opts: WorkspaceVault & { match?: string[]; nomatch?: string[] }
  ) {
    const { match, nomatch } = opts;
    const vpath = vault2Path(opts);
    const content = fs.readdirSync(vpath).join("\n");
    return AssertUtils.assertInString({ body: content, match, nomatch });
  }
}

/**
 * Legacy Multi-vault setup
 */
export class EngineTestUtilsV3 {
  static async setupWS(opts: SetupWSOptsV3) {
    const wsRoot = tmpDir().name;
    const vaults = await this.setupVaults({ ...opts, wsRoot });
    return { wsRoot, vaults };
  }

  static async setupVaults(opts: SetupVaultsOptsV3) {
    const { vaults } = _.defaults(opts, {
      vaults: [
        [tmpDir().name, "main"],
        [tmpDir().name, "other"],
      ].map(([vpath, vname]) => {
        return {
          fsPath: path.relative(opts.wsRoot, vpath),
          name: vname,
        };
      }),
    });
    //     {
    //       fsPath: tmpDir().name,
    //       name: "main",
    //     },
    //     {
    //       fsPath: tmpDir().name,
    //       name: "other",
    //     },
    //   ],
    // });
    const cb = [opts.initVault1, opts.initVault2];
    await Promise.all(
      vaults.map(async (ent, idx) => {
        const { fsPath } = ent;
        return EngineTestUtilsV2.setupVault({
          ...opts,
          vaultDir: path.join(opts.wsRoot, fsPath),
          initDirCb: cb[idx],
        });
      })
    );
    return vaults;
  }
}

export class EngineTestUtilsV2 {
  static async setupWS(opts: SetupWSOpts) {
    const { initDirCb, withAssets, withGit } = _.defaults(opts, {
      withAssets: true,
      withGit: true,
    });
    const wsRoot = opts.wsRoot ? opts.wsRoot : tmpDir().name;
    const vaultDir = opts.vaultDir ? opts.vaultDir : path.join(wsRoot, "vault");
    await fs.ensureDir(vaultDir);
    await EngineTestUtilsV2.setupVault({
      vaultDir,
      initDirCb,
      withAssets,
      withGit,
    });
    const vaults = [vaultDir];
    return {
      wsRoot,
      vaults,
    };
  }
  static async setupVault(opts: SetupVaultOpts): Promise<string> {
    const { withAssets, withGit } = opts;
    let vaultDir = opts.vaultDir ? opts.vaultDir : tmpDir().name;
    if (opts?.initDirCb) {
      await opts.initDirCb(vaultDir);
    }
    if (withAssets) {
      const assetsDir = path.join(vaultDir, "assets");
      await fs.ensureDir(assetsDir);
      await fs.ensureFile(path.join(assetsDir, "foo.jpg"));
    }
    if (withGit) {
      fs.ensureDirSync(path.join(vaultDir, ".git"));
    }
    return vaultDir;
  }
}

// === Legacy, deprecate

export class NodeTestUtilsV2 {
  static createNoteProps = async (opts: {
    rootName: string;
    vaultPath: string;
    props?: Partial<NoteProps>;
  }) => {
    const { rootName, vaultPath, props } = opts;
    const vault = { fsPath: vaultPath };
    const foo = NoteUtils.create({
      fname: `${rootName}`,
      id: `${rootName}`,
      created: 1,
      updated: 1,
      children: ["ch1"],
      ...props,
      vault,
    });
    const ch1 = NoteUtils.create({
      fname: `${rootName}.ch1`,
      id: `${rootName}.ch1`,
      created: 1,
      updated: 1,
      vault,
      ...props,
    });
    await note2File({
      note: foo,
      vault: { fsPath: vaultPath },
      wsRoot: "fake_root",
    });
    await note2File({
      note: ch1,
      vault: { fsPath: vaultPath },
      wsRoot: "fake_root",
    });
    return { foo, ch1 };
  };

  static createNote = async (opts: {
    withBody?: boolean;
    vaultDir: string;
    noteProps?: Omit<NoteOpts, "vault"> & { vault?: DVault };
  }): Promise<NoteProps> => {
    const cleanOpts = _.defaults(opts, {
      withBody: true,
      noteProps: [] as NoteOpts[],
    });
    const defaultOpts = {
      created: 1,
      updated: 1,
    };
    const n = cleanOpts.noteProps;
    const body = cleanOpts.withBody ? n.fname + " body" : "";
    const vault = { fsPath: cleanOpts.vaultDir };
    const _n = NoteUtils.create({ ...defaultOpts, body, ...n, vault });
    await note2File({
      note: _n,
      vault: { fsPath: cleanOpts.vaultDir },
      wsRoot: "fake_root",
    });
    return _n;
  };

  static createNotes = async (opts: {
    withBody?: boolean;
    vaultPath: string;
    noteProps?: (Omit<NoteOpts, "vault"> & { vault?: DVault })[];
  }): Promise<NotePropsDict> => {
    const cleanOpts = _.defaults(opts, {
      withBody: true,
      noteProps: [] as NoteOpts[],
    });
    const vault = { fsPath: cleanOpts.vaultPath };
    const defaultOpts = {
      created: 1,
      updated: 1,
    };
    const rootNote = await NoteUtils.createRoot({
      ...defaultOpts,
      vault,
    });
    const out: NotePropsDict = {
      root: rootNote,
    };
    await Promise.all(
      cleanOpts.noteProps.map(async (n) => {
        const body = cleanOpts.withBody ? n.fname + " body" : "";
        const _n = NoteUtils.create({ ...defaultOpts, body, ...n, vault });
        DNodeUtils.addChild(rootNote, _n);
        if (cleanOpts.vaultPath) {
          await note2File({
            note: _n,
            vault: { fsPath: cleanOpts.vaultPath },
            wsRoot: "fake_root",
          });
        }
        out[_n.id] = _n;
        return;
      })
    );
    await note2File({
      note: rootNote,
      vault: { fsPath: cleanOpts.vaultPath },
      wsRoot: "fake_root",
    });
    return out;
  };

  static createSchema = async (opts: {
    vaultDir: string;
    fname: string;
    schemas: SchemaProps[];
  }): Promise<SchemaModuleProps> => {
    const { vaultDir, schemas, fname } = opts;
    const schema = SchemaUtils.createModuleProps({
      fname,
      vault: { fsPath: vaultDir },
    });
    schemas.forEach((s) => {
      schema.schemas[s.id] = s;
    });
    await schemaModuleProps2File(schema, vaultDir, fname);
    return schema;
  };

  static createSchemas = async (opts: {
    vaultPath: string;
    schemaMO?: [SchemaModuleOpts, string][];
  }) => {
    const cleanOpts = _.defaults(opts, {
      schemaMO: [] as [SchemaModuleOpts, string][],
    });
    const { vaultPath, schemaMO } = cleanOpts;
    const vault = { fsPath: vaultPath };
    const rootModule = SchemaUtils.createRootModule({
      created: 1,
      updated: 1,
      vault,
    });
    await schemaModuleOpts2File(rootModule, vaultPath, "root");
    await Promise.all(
      schemaMO.map(async (ent) => {
        const [module, fname] = ent;
        if (vaultPath) {
          await schemaModuleOpts2File(module, vaultPath, fname);
        }
      })
    );
  };

  static createSchemaModuleOpts = async (opts: {
    vaultDir: string;
    rootName: string;
    rootOpts?: Partial<SchemaProps>;
  }) => {
    const { vaultDir, rootName, rootOpts } = opts;
    const vault = { fsPath: vaultDir };
    const schema = SchemaUtils.createFromSchemaOpts({
      fname: `${rootName}`,
      id: `${rootName}`,
      parent: "root",
      created: 1,
      updated: 1,
      children: ["ch1"],
      vault,
      ...rootOpts,
    });
    const ch1 = SchemaUtils.createFromSchemaOpts({
      fname: `${rootName}`,
      vault,
      id: "ch1",
      created: 1,
      updated: 1,
    });
    DNodeUtils.addChild(schema, ch1);
    const schemaModuleProps: [SchemaModuleOpts, string][] = [
      [
        SchemaUtils.createModule({
          version: 1,
          schemas: [schema, ch1],
        }),
        `${rootName}`,
      ],
    ];
    await Promise.all(
      schemaModuleProps.map((ent) => {
        const [module, fname] = ent;
        return schemaModuleOpts2File(module, vaultDir, fname);
      })
    );
    return schemaModuleProps[0][0];
  };

  static normalizeNote({ note }: { note: NoteProps }): Partial<NoteProps> {
    return {
      ..._.omit(note, ["body", "parent", "id", "vault"]),
      body: _.trim(note.body),
    };
  }

  static normalizeNotes(
    notes: NoteProps[] | NotePropsDict
  ): Partial<NoteProps>[] {
    if (!_.isArray(notes)) {
      notes = _.values(notes);
    }
    return notes.map((note) => {
      return NodeTestUtilsV2.normalizeNote({ note });
      //return { ..._.omit(note, ["body", "parent", "id"]), body: _.trim(note.body) };
    });
  }
}
