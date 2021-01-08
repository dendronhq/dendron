import {
  DEngineClientV2,
  ERROR_CODES,
  NoteUtilsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import {
  note2File,
  schemaModuleOpts2File,
  vault2Path,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import path from "path";
import { DENDRON_COMMANDS } from "../constants";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type ReloadIndexCommandOpts = {};

export class ReloadIndexCommand extends BasicCommand<
  ReloadIndexCommandOpts,
  DEngineClientV2 | undefined
> {
  static key = DENDRON_COMMANDS.RELOAD_INDEX.key;
  /**
   * Update index
   * @param opts
   */
  async execute(): Promise<DEngineClientV2 | undefined> {
    const ctx = "ReloadIndex.execute";
    this.L.info({ ctx, msg: "enter" });
    const ws = DendronWorkspace.instance();
    const wsRoot = DendronWorkspace.wsRoot();
    const engine = ws.getEngine();

    await Promise.all(
      engine.vaultsv3.map(async (vault) => {
        const vaultDir = vault2Path({ wsRoot, vault });
        const rootNotePath = path.join(vaultDir, "root.md");
        const rootSchemaPath = path.join(vaultDir, "root.schema.yml");
        if (!(await fs.pathExists(rootSchemaPath))) {
          const schema = SchemaUtilsV2.createRootModule({ vault });
          this.L.info({ ctx, vaultDir, msg: "creating root schema" });
          await schemaModuleOpts2File(schema, vaultDir, "root");
        }
        if (!fs.pathExistsSync(rootNotePath)) {
          const note = NoteUtilsV2.createRoot({ vault });
          this.L.info({ ctx, vaultDir, msg: "creating root note" });
          await note2File({ note, vault, wsRoot: DendronWorkspace.wsRoot() });
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
