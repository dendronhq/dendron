import { DEngine } from "@dendronhq/common-all/src";
import { createLogger } from "@dendronhq/common-server";
import { DendronEngine } from "@dendronhq/engine-server";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

const L = createLogger("ReloadIndexCommand");

type ReloadIndexCommandOpts = {
};

export class ReloadIndexCommand extends BasicCommand<ReloadIndexCommandOpts, DEngine> {

  /**
   * Update index
   * @param opts 
   */
  async execute() {
    const ctx = "execute";
    L.info({ ctx });
    const ws = DendronWorkspace.instance();
    const root = ws.rootWorkspace.uri.fsPath;
    const engine = DendronEngine.getOrCreateEngine({
      root, 
      forceNew: true,
      logger: ws.L
    });
    await engine.init();
    ws._engine = engine;
    return engine;
  }
}
