import {
  DEngineClientV2,
  ERROR_SEVERITY,
  NoteUtils,
  SchemaUtils,
} from "@dendronhq/common-all";
import {
  getDurationMilliseconds,
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
          const schema = SchemaUtils.createRootModule({ vault });
          this.L.info({ ctx, vaultDir, msg: "creating root schema" });
          await schemaModuleOpts2File(schema, vaultDir, "root");
        }
        if (!fs.pathExistsSync(rootNotePath)) {
          const note = NoteUtils.createRoot({ vault });
          this.L.info({ ctx, vaultDir, msg: "creating root note" });
          await note2File({ note, vault, wsRoot: DendronWorkspace.wsRoot() });
        }
      })
    );
    const start = process.hrtime();
    const { error } = await engine.init();
    const durationEngineInit = getDurationMilliseconds(start);
    this.L.info({ ctx, durationEngineInit });

    // if fatal, stop initialization
    if (error && error.severity !== ERROR_SEVERITY.MINOR) {
      this.L.error({ ctx, error, msg: "unable to initialize engine" });
      return;
    }
    if (error) {
      let msg = "init error";
      this.L.error({ ctx, error, msg });
    }
    this.L.info({ ctx, msg: "exit" });
    ws.dendronTreeView?.treeProvider.refresh();
    return engine;
  }
}
