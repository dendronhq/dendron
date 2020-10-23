import {
  DEngine,
  DEngineClientV2,
  NoteUtilsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import fs from "fs-extra";
import path from "path";
import { note2File, schemaModuleOpts2File } from "@dendronhq/common-server";

type ReloadIndexCommandOpts = {};

export class ReloadIndexCommand extends BasicCommand<
  ReloadIndexCommandOpts,
  DEngine | DEngineClientV2 | undefined
> {
  /**
   * Update index
   * @param opts
   */
  async execute() {
    const ctx = "ReloadIndex.execute";
    this.L.info({ ctx, msg: "enter" });
    const ws = DendronWorkspace.instance();
    if (DendronWorkspace.lsp()) {
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
      if (error) {
        this.L.error({ ctx, error, msg: "unable to initialize engine" });
        return;
      }
      this.L.info({ ctx, msg: "exit" });
      ws.dendronTreeView?.treeProvider.refresh();
      return engine;
    } else {
      const engine = ws.engine;
      await engine.init();
      this.L.info({ ctx, msg: "exit" });
      return engine;
    }
  }
}
