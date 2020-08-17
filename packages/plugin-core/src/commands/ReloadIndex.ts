import { DEngine } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type ReloadIndexCommandOpts = {};

export class ReloadIndexCommand extends BasicCommand<
  ReloadIndexCommandOpts,
  DEngine
> {
  /**
   * Update index
   * @param opts
   */
  async execute() {
    const ctx = "ReloadIndex.execute";
    this.L.info({ ctx, msg: "enter" });
    const ws = DendronWorkspace.instance();
    const root = ws.rootWorkspace.uri.fsPath;
    const engine = DendronEngine.getOrCreateEngine({
      root,
      forceNew: true,
      logger: ws.L,
    });
    await engine.init();
    ws._engine = engine;
    this.L.info({ ctx, msg: "exit" });
    return engine;
  }
}
