import { DEngine, DEngineV2 } from "@dendronhq/common-all";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type ReloadIndexCommandOpts = {};

export class ReloadIndexCommand extends BasicCommand<
  ReloadIndexCommandOpts,
  DEngine | DEngineV2
> {
  /**
   * Update index
   * @param opts
   */
  async execute() {
    const ctx = "ReloadIndex.execute";
    this.L.info({ ctx, msg: "enter" });
    const ws = DendronWorkspace.instance();
    const engine = ws.engine;
    await engine.init();
    this.L.info({ ctx, msg: "exit" });
    return engine;
  }
}
