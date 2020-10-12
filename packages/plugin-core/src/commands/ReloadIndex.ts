import { DEngine, DEngineClientV2 } from "@dendronhq/common-all";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

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
      const { error } = await engine.init();
      if (error) {
        this.L.error({ ctx, error, msg: "unable to initialize engine" });
      }
      this.L.info({ ctx, msg: "exit" });
      return engine;
    } else {
      const engine = ws.engine;
      await engine.init();
      this.L.info({ ctx, msg: "exit" });
      return engine;
    }
  }
}
