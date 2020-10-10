import {
  DNodeUtilsV2,
  NoteChangeEntry,
  NoteOptsV2,
  NotePropsDictV2,
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
import _ from "lodash";
import fs from "fs-extra";

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

export class NoteTestPresetsV2 {
  static presets = {
    OneNoteOneSchemaPreset: {
      delete: {
        noteNoChildren: {
          label: "note w/no children",
          results: NoteTestPresetsV2.createDeleteNoteWNoChildrenResults,
        },
        domainChildren: {
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
        },
        domainNoChildren: {
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
        },
      },
      update: {
        noteNoChildren: {
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
        },
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
