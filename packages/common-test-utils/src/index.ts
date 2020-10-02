import {
  DNodeUtilsV2,
  NoteOptsV2,
  NotePropsDictV2,
  NoteUtilsV2,
  SchemaModuleOptsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import { note2File, schemaModule2File, tmpDir } from "@dendronhq/common-server";
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
  static createNotes = async (opts: {
    withBody?: boolean;
    vaultPath?: string;
    noteProps?: NoteOptsV2[];
  }): Promise<NotePropsDictV2> => {
    const cleanOpts = _.defaults(opts, {
      withBody: true,
      noteProps: [] as NoteOptsV2[],
    });
    const rootNote = await NoteUtilsV2.createRoot({
      created: "1",
      updated: "1",
    });
    const out: NotePropsDictV2 = {
      root: rootNote,
    };
    await Promise.all(
      cleanOpts.noteProps.map(async (n) => {
        const body = cleanOpts.withBody ? n.fname + " body" : "";
        const _n = NoteUtilsV2.create({ ...n, body });
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
    schemaModuleProps?: [SchemaModuleOptsV2, string][];
  }) => {
    const cleanOpts = _.defaults(opts, {
      schemaModuleProps: [] as [SchemaModuleOptsV2, string][],
    });
    const { vaultPath, schemaModuleProps } = cleanOpts;
    const rootModule = SchemaUtilsV2.createRootModule({
      created: "1",
      updated: "1",
    });
    if (vaultPath) {
      await schemaModule2File(rootModule, vaultPath, "root");
    }
    await Promise.all(
      schemaModuleProps.map(async (ent) => {
        const [module, fname] = ent;
        if (vaultPath) {
          await schemaModule2File(module, vaultPath, fname);
        }
      })
    );
  };
}
