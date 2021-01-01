import {
  DNodeUtilsV2,
  DVault,
  genUUID,
  NoteChangeEntry,
  NoteOptsV2,
  NotePropsDictV2,
  NotePropsV2,
  NoteUtilsV2,
  SchemaModuleOptsV2,
  SchemaModulePropsV2,
  SchemaPropsV2,
  SchemaUtilsV2,
  WorkspaceOpts,
} from "@dendronhq/common-all";
import {
  note2File,
  resolvePath,
  schemaModuleOpts2File,
  schemaModuleProps2File,
  tmpDir,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { PreSetupHookFunctionV4, TestResult } from "./types";
export * from "./fileUtils";
export * from "./noteUtils";
export * from "./presets";
export * from "./types";
export * from "./utils";
export * from "./utilsv2";
import assert from "assert";
import { TestPresetEntry } from "./utils";
import sinon from "sinon";
export { sinon };

export function filterDotFiles(filenames: string[]) {
  return filenames.filter((filename) => !/(^|\/)\.[^\/\.]/g.test(filename));
}

export function getLogFilePath(name: string) {
  // Placing these in the system temp directory proved difficult, as we both
  // want to generate paths here and pass them from npm in the various LOG_DST
  // environment variables. There's no consistent environment variable we can
  // use for this:
  //
  // * TMPDIR is set for some POSIX-likes, e.g. macOS, but not Linux.
  // * TEMP is set on Windows.
  const rootDir = path.dirname(path.dirname(path.dirname(__dirname)));
  return path.join(rootDir, "logs", `${name}.log`);
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
  static async setupWS(
    opts?: { wsRoot?: string } & {
      setupVaultsOpts?: SetupVaultsOptsV4[];
      singleVault?: boolean;
    }
  ): Promise<WorkspaceOpts> {
    const wsRoot = opts?.wsRoot || tmpDir().name;
    const defaultVaults = opts?.singleVault ? ["vault1"] : ["vault1", "vault2"];
    const setupVaultsOpts: SetupVaultsOptsV4[] =
      opts?.setupVaultsOpts ||
      defaultVaults.map((ent) => ({
        vault: { fsPath: ent },
        preSetupHook: async ({ vpath, vault, wsRoot }) => {
          const rootModule = SchemaUtilsV2.createRootModule({
            created: "1",
            updated: "1",
            vault,
          });
          await schemaModuleOpts2File(rootModule, vpath, "root");

          const rootNote = await NoteUtilsV2.createRoot({
            created: "1",
            updated: "1",
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
    let wsRoot = opts.wsRoot ? opts.wsRoot : tmpDir().name;
    let vaultDir = opts.vaultDir ? opts.vaultDir : path.join(wsRoot, "vault");
    await fs.ensureDir(vaultDir);
    await EngineTestUtilsV2.setupVault({
      vaultDir,
      initDirCb,
      withAssets,
      withGit,
    });
    let vaults = [vaultDir];
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
    props?: Partial<NotePropsV2>;
  }) => {
    const { rootName, vaultPath, props } = opts;
    const vault = { fsPath: vaultPath };
    const foo = NoteUtilsV2.create({
      fname: `${rootName}`,
      id: `${rootName}`,
      created: "1",
      updated: "1",
      children: ["ch1"],
      ...props,
      vault,
    });
    const ch1 = NoteUtilsV2.create({
      fname: `${rootName}.ch1`,
      id: `${rootName}.ch1`,
      created: "1",
      updated: "1",
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
    noteProps?: Omit<NoteOptsV2, "vault"> & { vault?: DVault };
  }): Promise<NotePropsV2> => {
    const cleanOpts = _.defaults(opts, {
      withBody: true,
      noteProps: [] as NoteOptsV2[],
    });
    const defaultOpts = {
      created: "1",
      updated: "1",
    };
    const n = cleanOpts.noteProps;
    const body = cleanOpts.withBody ? n.fname + " body" : "";
    const vault = { fsPath: cleanOpts.vaultDir };
    const _n = NoteUtilsV2.create({ ...defaultOpts, body, ...n, vault });
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
    noteProps?: (Omit<NoteOptsV2, "vault"> & { vault?: DVault })[];
  }): Promise<NotePropsDictV2> => {
    const cleanOpts = _.defaults(opts, {
      withBody: true,
      noteProps: [] as NoteOptsV2[],
    });
    const vault = { fsPath: cleanOpts.vaultPath };
    const defaultOpts = {
      created: "1",
      updated: "1",
    };
    const rootNote = await NoteUtilsV2.createRoot({
      ...defaultOpts,
      vault,
    });
    const out: NotePropsDictV2 = {
      root: rootNote,
    };
    await Promise.all(
      cleanOpts.noteProps.map(async (n) => {
        const body = cleanOpts.withBody ? n.fname + " body" : "";
        const _n = NoteUtilsV2.create({ ...defaultOpts, body, ...n, vault });
        DNodeUtilsV2.addChild(rootNote, _n);
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
    schemas: SchemaPropsV2[];
  }): Promise<SchemaModulePropsV2> => {
    const { vaultDir, schemas, fname } = opts;
    const schema = SchemaUtilsV2.createModuleProps({
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
    schemaMO?: [SchemaModuleOptsV2, string][];
  }) => {
    const cleanOpts = _.defaults(opts, {
      schemaMO: [] as [SchemaModuleOptsV2, string][],
    });
    const { vaultPath, schemaMO } = cleanOpts;
    const vault = { fsPath: vaultPath };
    const rootModule = SchemaUtilsV2.createRootModule({
      created: "1",
      updated: "1",
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
    rootOpts?: Partial<SchemaPropsV2>;
  }) => {
    const { vaultDir, rootName, rootOpts } = opts;
    const vault = { fsPath: vaultDir };
    const schema = SchemaUtilsV2.create({
      fname: `${rootName}`,
      id: `${rootName}`,
      parent: "root",
      created: "1",
      updated: "1",
      children: ["ch1"],
      vault,
      ...rootOpts,
    });
    const ch1 = SchemaUtilsV2.create({
      fname: `${rootName}`,
      vault,
      id: "ch1",
      created: "1",
      updated: "1",
    });
    DNodeUtilsV2.addChild(schema, ch1);
    const schemaModuleProps: [SchemaModuleOptsV2, string][] = [
      [
        SchemaUtilsV2.createModule({
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

  static normalizeNote({ note }: { note: NotePropsV2 }): Partial<NotePropsV2> {
    return {
      ..._.omit(note, ["body", "parent", "id", "vault"]),
      body: _.trim(note.body),
    };
  }

  static normalizeNotes(
    notes: NotePropsV2[] | NotePropsDictV2
  ): Partial<NotePropsV2>[] {
    if (!_.isArray(notes)) {
      notes = _.values(notes);
    }
    return notes.map((note) => {
      return NodeTestUtilsV2.normalizeNote({ note });
      //return { ..._.omit(note, ["body", "parent", "id"]), body: _.trim(note.body) };
    });
  }
}

export class NodeTestPresetsV2 {
  static async runMochaHarness<TOpts>({
    opts,
    results,
  }: {
    opts: TOpts;
    results: any;
  }) {
    return _.map(await results(opts), (ent) =>
      assert.deepStrictEqual(ent.actual, ent.expected)
    );
  }
  static async runJestHarness<TOpts>({
    opts,
    results,
    expect,
  }: {
    opts: TOpts;
    results: Function;
    expect: jest.Expect;
  }) {
    return _.map(await results(opts), (ent) =>
      expect(ent.actual).toEqual(ent.expected)
    );
  }

  static async createNoteRefPreset({ vaultDir }: { vaultDir: string }) {
    await NodeTestPresetsV2.createOneNoteOneSchemaPresetWithBody({ vaultDir });
    await NodeTestUtilsV2.createNote({
      vaultDir,
      noteProps: {
        body: "((ref: [[foo]]))",
        fname: "bar",
        vault: { fsPath: vaultDir },
      },
    });
  }

  static async createSchemaPreset({ vaultDir }: { vaultDir: string }) {
    const vault = { fsPath: vaultDir };
    await NodeTestPresetsV2.createOneNoteOneSchemaPreset({ vaultDir });
    await NodeTestUtilsV2.createSchema({
      vaultDir,
      schemas: [
        SchemaUtilsV2.create({
          id: "bar",
          parent: "root",
          children: ["ch1", "ch2"],
          vault,
        }),
        SchemaUtilsV2.create({
          id: "ch1",
          template: { id: "bar.template.ch1", type: "note" },
          vault,
        }),
        SchemaUtilsV2.create({
          id: "ch2",
          template: { id: "bar.template.ch2", type: "note" },
          namespace: true,
          vault,
        }),
      ],
      fname: "bar",
    });
    await NodeTestUtilsV2.createNote({
      vaultDir,
      noteProps: { body: "ch1 template", fname: "bar.template.ch1", vault },
    });
    await NodeTestUtilsV2.createNote({
      vaultDir,
      noteProps: {
        body: "ch2 template",
        fname: "bar.template.ch2",
        vault,
      },
    });
  }

  static async createOneNoteOneSchemaPresetWithBody({
    vaultDir,
  }: {
    vaultDir: string;
  }) {
    await NodeTestUtilsV2.createSchemas({ vaultPath: vaultDir });
    await NodeTestUtilsV2.createNotes({
      vaultPath: vaultDir,
    });
    await NodeTestUtilsV2.createNoteProps({
      vaultPath: vaultDir,
      rootName: "foo",
      props: {
        body: "foo body",
      },
    });
    await NodeTestUtilsV2.createSchemaModuleOpts({
      vaultDir: vaultDir,
      rootName: "foo",
    });
  }
  static async createOneNoteOneSchemaPreset({
    vaultDir,
  }: {
    vaultDir: string;
  }) {
    await NodeTestUtilsV2.createSchemas({ vaultPath: vaultDir });
    await NodeTestUtilsV2.createNotes({ vaultPath: vaultDir });
    await NodeTestUtilsV2.createNoteProps({
      vaultPath: vaultDir,
      rootName: "foo",
    });
    await NodeTestUtilsV2.createSchemaModuleOpts({
      vaultDir: vaultDir,
      rootName: "foo",
    });
  }
}

type CreateNoteOpts = {
  vault: DVault;
  fname: string;
  body?: string;
  props?: Partial<Omit<NotePropsV2, "vault|fname|body">>;
  genRandomId?: boolean;
  noWrite?: boolean;
};

export class NoteTestUtilsV3 {
  static createNote = async (opts: CreateNoteOpts) => {
    const { fname, vault, props, body, genRandomId, noWrite } = _.defaults(
      opts,
      { noWrite: false }
    );
    /**
     * Make sure snapshots stay consistent
     */
    const defaultOpts = {
      created: "1",
      updated: "1",
      id: genRandomId ? genUUID() : fname,
    };

    const note = NoteUtilsV2.create({
      ...defaultOpts,
      ...props,
      fname,
      vault,
      body,
    });
    if (!noWrite) {
      await note2File({ note, vault, wsRoot: "FAKE_ROOT" });
    }
    return note;
  };
}

type NoteTestPresetGroup<TBeforeOpts, TResultsOpts> = {
  [key: string]: TestPresetEntry<TBeforeOpts, any, TResultsOpts>;
};

type NoteTestPresetModule<TBeforeOpts, TResultsOpts> = {
  [key: string]: NoteTestPresetGroup<TBeforeOpts, TResultsOpts>;
};

type NoteTestPresetCollectionDict<TBeforeOpts = any, TResultsOpts = any> = {
  [key: string]: NoteTestPresetModule<TBeforeOpts, TResultsOpts>;
};

type DeleteNoteTestOptsV2 = {
  changed: NoteChangeEntry[];
  notes: NotePropsDictV2;
  vaultDir: string;
};

type UpdateNoteTestOptsV2 = {
  notes: NotePropsDictV2;
  vaultDir: string;
};

export class NoteTestPresetsV2 {
  static async createJestTest({
    executeCb,
    beforeArgs,
    expect,
    entry,
  }: {
    entry: TestPresetEntry<any, any, any>;
    expect: jest.Expect;
    beforeArgs?: any;
    executeCb: () => Promise<any>;
  }) {
    await entry.before(beforeArgs);
    const results = entry.results;
    const executeResp = await executeCb();
    await NodeTestPresetsV2.runJestHarness({
      opts: executeResp,
      results,
      expect,
    });
  }

  static presets: NoteTestPresetCollectionDict = {
    OneNoteOneSchemaPreset: {
      init: {
        domainStub: new TestPresetEntry({
          label: "domain stub",
          before: async ({ vaultDir }: { vaultDir: string }) => {
            fs.removeSync(path.join(vaultDir, "foo.md"));
          },
          results: async ({ notes }: { notes: NotePropsDictV2 }) => {
            const note = NoteUtilsV2.getNoteByFname(
              "foo",
              notes
            ) as NotePropsV2;
            const vault = note.vault;
            const root = NoteUtilsV2.getNoteByFname("root", notes, {
              vault,
            }) as NotePropsV2;
            const scenarios = [
              { actual: _.size(notes), expected: 3 },
              { actual: root.children, expected: [note.id] },
            ];
            return scenarios;
          },
        }),
      },
      delete: {
        noteNoChildren: new TestPresetEntry({
          label: "note w/no children",
          results: NoteTestPresetsV2.createDeleteNoteWNoChildrenResults,
        }),
        domainChildren: new TestPresetEntry({
          label: "domain with children",
          results: async ({
            changed,
            notes,
            vaultDir,
          }: DeleteNoteTestOptsV2): Promise<TestResult[]> => {
            return [
              {
                actual: changed,
                expected: [{ note: notes["foo"], status: "update" }],
                msg: "note updated",
              },
              {
                actual: _.size(notes),
                expected: 3,
                msg: "same number of notes",
              },
              {
                actual: notes["foo"].stub,
                expected: true,
                msg: "foo should be a stub",
              },
              {
                actual: _.includes(fs.readdirSync(vaultDir), "foo.md"),
                expected: false,
                msg: "note should be deleted",
              },
            ];
          },
        }),
        domainNoChildren: new TestPresetEntry({
          label: "domain w/no children",
          results: async ({
            changed,
            notes,
            vaultDir,
          }: DeleteNoteTestOptsV2): Promise<TestResult[]> => {
            return [
              {
                actual: changed[0].note.fname,
                expected: "root",
                msg: "root updated",
              },
              {
                actual: changed[0].note.children,
                expected: [],
                msg: "root does not have children",
              },
              { actual: _.size(notes), expected: 1 },
              { actual: notes["foo"], expected: undefined },
              {
                actual: _.includes(fs.readdirSync(vaultDir), "foo.md"),
                expected: false,
              },
            ];
          },
        }),
      },
      update: {
        noteNoChildren: new TestPresetEntry({
          label: "update note, no children",
          results: async ({
            notes,
          }: UpdateNoteTestOptsV2): Promise<TestResult[]> => {
            return [
              {
                actual: _.pick(notes["foo.ch1"], "body"),
                expected: { body: "new body" },
                msg: "update body",
              },
            ];
          },
        }),
      },
      write: {
        domainStub: new TestPresetEntry({
          label: "write child, parent stub",
          before: async ({ vaultDir }: { vaultDir: string }) => {
            const note = NoteUtilsV2.create({
              fname: "bar.ch1",
              vault: { fsPath: vaultDir },
            });
            await note2File({
              note,
              vault: { fsPath: vaultDir },
              wsRoot: "FAKE",
            });
          },
          results: async ({ notes }: { notes: NotePropsDictV2 }) => {
            const root = NoteUtilsV2.getNoteByFname(
              "root",
              notes
            ) as NotePropsV2;
            const bar = NoteUtilsV2.getNoteByFname("bar", notes) as NotePropsV2;
            const child = NoteUtilsV2.getNoteByFname(
              "bar.ch1",
              notes
            ) as NotePropsV2;
            return [
              {
                actual: _.size(root.children),
                expected: 2,
                msg: "root, foo, bar",
              },
              {
                actual: _.pick(bar, "stub"),
                expected: { stub: true },
                msg: "bar created as stub",
              },
              {
                actual: _.pick(child, ["fname", "stub"]),
                expected: { fname: "bar.ch1" },
                msg: "child is not stub",
              },
            ];
          },
        }),
        serializeChildWithHierarchy: new TestPresetEntry({
          label: "write child, serialize with hierarchy",
          before: async ({ vaultDir }: { vaultDir: string }) => {
            fs.removeSync(path.join(vaultDir, "foo.ch1.md"));
          },
          results: async ({
            vaultDir,
          }: {
            notes: NotePropsDictV2;
            vaultDir: string;
          }) => {
            const rawNote = fs.readFileSync(path.join(vaultDir, "foo.ch1.md"), {
              encoding: "utf8",
            });
            return [
              {
                actual: rawNote.match(/^parent: foo/gm),
                expected: ["parent: foo"],
                msg: "should have parent",
              },
            ];
          },
        }),
      },
    },
  };

  static async createDeleteNoteWNoChildrenResults({
    changed,
    notes,
    vaultDir,
  }: DeleteNoteTestOptsV2): Promise<TestResult[]> {
    return [
      { actual: changed[0].note.id, expected: "foo" },
      { actual: _.size(notes), expected: 2 },
      { actual: notes["foo"].children, expected: [] },
      {
        actual: _.includes(fs.readdirSync(vaultDir), "foo.ch1.md"),
        expected: false,
      },
    ];
  }
}
