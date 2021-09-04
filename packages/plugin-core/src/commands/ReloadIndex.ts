import {
  DEngineClient,
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
import { ProgressLocation, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { getExtension, getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type ReloadIndexCommandOpts = {
  silent?: boolean;
};

export class ReloadIndexCommand extends BasicCommand<
  ReloadIndexCommandOpts,
  DEngineClient | undefined
> {
  key = DENDRON_COMMANDS.RELOAD_INDEX.key;
  silent = true;
  /**
   * Update index
   * @param opts
   */
  async execute(
    opts?: ReloadIndexCommandOpts
  ): Promise<DEngineClient | undefined> {
    const ctx = "ReloadIndex.execute";
    this.L.info({ ctx, msg: "enter" });
    const ws = getDWorkspace();
    const { wsRoot, engine } = ws;

    const reloadIndex = async () => {
      await Promise.all(
        engine.vaults.map(async (vault) => {
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
            await note2File({
              note,
              vault,
              wsRoot,
            });
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
        const msg = "init error";
        this.L.error({ ctx, error, msg });
      }
    };

    if (!(opts && !opts.silent)) {
      await reloadIndex();
    } else {
      await window.withProgress(
        {
          location: ProgressLocation.Notification,
          title: "Reloading Index...",
          cancellable: false,
        },
        reloadIndex
      );
    }

    this.L.info({ ctx, msg: "exit" });
    getExtension().dendronTreeView?.treeProvider.refresh();
    return engine;
  }
}
