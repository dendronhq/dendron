import {
  DEngineClientV2,
  ERROR_CODES,
  NoteUtilsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import { note2File, schemaModuleOpts2File } from "@dendronhq/common-server";
import fs from "fs-extra";
import path from "path";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type ReloadIndexCommandOpts = {};

export class ReloadIndexCommand extends BasicCommand<
  ReloadIndexCommandOpts,
  DEngineClientV2 | undefined
> {
  /**
   * Update index
   * @param opts
   */
  async execute() {
    const ctx = "ReloadIndex.execute";
    this.L.info({ ctx, msg: "enter" });
    const ws = DendronWorkspace.instance();
    const engine = ws.getEngine();
    await Promise.all(
      engine.vaults.map(async (vaultDir) => {
        const rootNotePath = path.join(vaultDir, "root.md");
        const rootSchemaPath = path.join(vaultDir, "root.schema.yml");
        if (!(await fs.pathExists(rootSchemaPath))) {
          const schema = SchemaUtilsV2.createRootModule({});
          this.L.info({ ctx, vaultDir, msg: "creating root schema" });
          await schemaModuleOpts2File(schema, vaultDir, "root");
        }
        if (!fs.pathExistsSync(rootNotePath)) {
          const note = NoteUtilsV2.createRoot({});
          this.L.info({ ctx, vaultDir, msg: "creating root note" });
          await note2File(note, vaultDir);
        }
      })
    );
    const { error } = await engine.init();
    if (error && error.code !== ERROR_CODES.MINOR) {
      this.L.error({ ctx, error, msg: "unable to initialize engine" });
      return;
    }
    if (error) {
      let friendly: string | undefined;
      if (error.payload) {
        const payload = JSON.parse(error.payload).schema.payload;
        friendly = `Error with parsing some schemas during initialization. Please go to https://dendron.so/notes/c5e5adde-5459-409b-b34d-a0d75cbb1052.html#troubleshooting to resolve. ${payload}`;
      }
      this.L.error({ ctx, error, msg: `init error`, friendly });
    }
    this.L.info({ ctx, msg: "exit" });
    ws.dendronTreeView?.treeProvider.refresh();
    return engine;
  }
}
