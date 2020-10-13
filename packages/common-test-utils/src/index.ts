import {
  DNodeUtilsV2,
  NoteChangeEntry,
  NoteOptsV2,
  NotePropsDictV2,
  NotePropsV2,
  NoteUtilsV2,
  SchemaModuleOptsV2,
  SchemaModulePropsV2,
  SchemaPropsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import {
  note2File,
  schemaModuleOpts2File,
  tmpDir,
} from "@dendronhq/common-server";
import assert from "assert";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

export type SetupVaultOpts = {
  vaultDir?: string;
  initDirCb?: (vaultPath: string) => void;
};
export class EngineTestUtilsV2 {
  static async setupVault(opts: SetupVaultOpts): Promise<string> {
    let vaultDir = opts.vaultDir ? opts.vaultDir : tmpDir().name;
    if (opts?.initDirCb) {
      await opts.initDirCb(vaultDir);
    }
    return vaultDir;
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
    results: any;
    expect: jest.Expect;
  }) {
    return _.map(await results(opts), (ent) =>
      expect(ent.actual).toEqual(ent.expected)
    );
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

export type TestResult = {
  actual: any;
  expected: any;
  msg?: string;
};

type UpdateNoteTestOptsV2 = {
  notes: NotePropsDictV2;
  vaultDir: string;
};

type DeleteNoteTestOptsV2 = {
  changed: NoteChangeEntry[];
  notes: NotePropsDictV2;
  vaultDir: string;
};

type NoteTestPresetEntry<TBeforeOpts, TResultsOpts> = {
  label: string;
  init(): Promise<void>;
  before: (opts: TBeforeOpts) => Promise<void>;
  results: (opts: TResultsOpts) => Promise<TestResult[]>;
};

type NoteTestPresetGroup<TBeforeOpts, TResultsOpts> = {
  [key: string]: NoteTestPresetEntry<TBeforeOpts, TResultsOpts>;
};

type NoteTestPresetModule<TBeforeOpts, TResultsOpts> = {
  [key: string]: NoteTestPresetGroup<TBeforeOpts, TResultsOpts>;
};

type NoteTestPresetCollectionDict<TBeforeOpts = any, TResultsOpts = any> = {
  [key: string]: NoteTestPresetModule<TBeforeOpts, TResultsOpts>;
};

class TestPresetEntry<TBeforeOpts, TResultsOpts>
  implements NoteTestPresetEntry<TBeforeOpts, TResultsOpts> {
  public label: string;
  public before: (_opts: TBeforeOpts) => Promise<void>;
  public results: (_opts: TResultsOpts) => Promise<TestResult[]>;
  public init: () => Promise<void>;

  constructor({
    label,
    results,
    before,
  }: {
    label: string;
    before?: (_opts: TBeforeOpts) => Promise<void>;
    results: (_opts: TResultsOpts) => Promise<TestResult[]>;
    //init?: ({engine}: {engine: DEngineV2}) => Promise<void>;
  }) {
    this.label = label;
    this.results = results;
    this.before = before ? before : async () => {};
    this.init = async () => {};
  }
}

export class NoteTestPresetsV2 {
  static async createJestTest({
    executeCb,
    beforeArgs,
    expect,
    entry,
  }: {
    entry: TestPresetEntry<any, any>;
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
            const scenarios = [
              { actual: _.size(notes), expected: 3 },
              { actual: notes["root"].children, expected: [note.id] },
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
                actual: changed[0].note.id,
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
            const note = NoteUtilsV2.create({ fname: "bar.ch1" });
            await note2File(note, vaultDir);
          },
          results: async ({ notes }: { notes: NotePropsDictV2 }) => {
            const root = notes["root"];
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
                msg: "bar created as stub",
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

export class SchemaTestPresetsV2 {
  static async createQueryRootResults(
    schemas: SchemaModulePropsV2[]
  ): Promise<TestResult[]> {
    return [
      { actual: _.size(schemas[0].schemas), expected: 1, msg: "schema " },
    ];
  }
  static async createQueryAllResults(
    schemas: SchemaModulePropsV2[]
  ): Promise<TestResult[]> {
    return [
      { actual: _.size(schemas[0].schemas), expected: 2, msg: "schema " },
    ];
  }
  static async createQueryNonRootResults(
    schemas: SchemaModulePropsV2[]
  ): Promise<TestResult[]> {
    return [
      { actual: _.size(schemas[0].schemas), expected: 2, msg: "schema " },
    ];
  }
}

export class NodeTestUtilsV2 {
  static createNoteProps = async (opts: {
    rootName: string;
    vaultPath: string;
  }) => {
    const { rootName, vaultPath } = opts;
    const foo = NoteUtilsV2.create({
      fname: `${rootName}`,
      id: `${rootName}`,
      created: "1",
      updated: "1",
      children: ["ch1"],
    });
    const ch1 = NoteUtilsV2.create({
      fname: `${rootName}.ch1`,
      id: `${rootName}.ch1`,
      created: "1",
      updated: "1",
    });
    await note2File(foo, vaultPath);
    await note2File(ch1, vaultPath);
    return { foo, ch1 };
  };

  static createNotes = async (opts: {
    withBody?: boolean;
    vaultPath?: string;
    noteProps?: NoteOptsV2[];
  }): Promise<NotePropsDictV2> => {
    const cleanOpts = _.defaults(opts, {
      withBody: true,
      noteProps: [] as NoteOptsV2[],
    });
    const defaultOpts = {
      created: "1",
      updated: "1",
    };
    const rootNote = await NoteUtilsV2.createRoot({
      ...defaultOpts,
    });
    const out: NotePropsDictV2 = {
      root: rootNote,
    };
    await Promise.all(
      cleanOpts.noteProps.map(async (n) => {
        const body = cleanOpts.withBody ? n.fname + " body" : "";
        const _n = NoteUtilsV2.create({ ...defaultOpts, ...n, body });
        DNodeUtilsV2.addChild(rootNote, _n);
        if (cleanOpts.vaultPath) {
          await note2File(_n, cleanOpts.vaultPath);
        }
        out[_n.id] = _n;
        return;
      })
    );
    if (cleanOpts.vaultPath) {
      await note2File(rootNote, cleanOpts.vaultPath);
    }
    return out;
  };

  static createSchemas = async (opts: {
    vaultPath?: string;
    schemaMO?: [SchemaModuleOptsV2, string][];
  }) => {
    const cleanOpts = _.defaults(opts, {
      schemaMO: [] as [SchemaModuleOptsV2, string][],
    });
    const { vaultPath, schemaMO } = cleanOpts;
    const rootModule = SchemaUtilsV2.createRootModule({
      created: "1",
      updated: "1",
    });
    if (vaultPath) {
      await schemaModuleOpts2File(rootModule, vaultPath, "root");
    }
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
    const schema = SchemaUtilsV2.create({
      fname: `${rootName}`,
      id: `${rootName}`,
      parent: "root",
      created: "1",
      updated: "1",
      children: ["ch1"],
      ...rootOpts,
    });
    const ch1 = SchemaUtilsV2.create({
      fname: `${rootName}`,
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
}
