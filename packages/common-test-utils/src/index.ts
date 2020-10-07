import {
  DNodeUtilsV2,
  NoteOptsV2,
  NotePropsDictV2,
  NoteUtilsV2,
  SchemaModuleOptsV2,
  SchemaPropsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import {
  note2File,
  schemaModuleOpts2File,
  tmpDir,
} from "@dendronhq/common-server";
import _ from "lodash";
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
