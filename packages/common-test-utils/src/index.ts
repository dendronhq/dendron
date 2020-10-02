import {
  DNodeUtilsV2,
  NoteOptsV2,
  NoteUtilsV2,
  SchemaModulePropsV2,
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
  static createNotes = async (
    vaultPath: string,
    noteProps: NoteOptsV2[],
    opts?: { withBody: boolean }
  ) => {
    const cleanOpts = _.defaults(opts, { withBody: true });
    const rootNote = await NoteUtilsV2.createRoot({
      created: "1",
      updated: "1",
    });
    await Promise.all(
      noteProps.map((n) => {
        const body = cleanOpts.withBody ? n.fname + " body" : "";
        const _n = NoteUtilsV2.create({ ...n, body });
        DNodeUtilsV2.addChild(rootNote, _n);
        return note2File(_n, vaultPath);
      })
    );
    await note2File(rootNote, vaultPath);
  };

  static createSchemas = async (
    vaultPath: string,
    schemaModuleProps: [SchemaModulePropsV2, string][]
  ) => {
    const rootModule = SchemaUtilsV2.createRootModule({
      created: "1",
      updated: "1",
    });
    await schemaModule2File(rootModule, vaultPath, "root");
    await Promise.all(
      schemaModuleProps.map((ent) => {
        const [module, fname] = ent;
        return schemaModule2File(module, vaultPath, fname);
      })
    );
  };
}
