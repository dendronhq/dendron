import { createLogger } from "@dendronhq/common-server";
import { BaseCommand } from "./base";
import { DendronEngine } from "@dendronhq/engine-server";
import { DEngine } from "@dendronhq/common-all/src";

const L = createLogger("ReloadIndexCommand");

type ReloadIndexCommandOpts = {
  root: string;
};

export class ReloadIndexCommand extends BaseCommand<ReloadIndexCommandOpts, DEngine> {
  async execute(opts: ReloadIndexCommandOpts) {
    const ctx = "execute";
    L.info({ ctx, opts });
    const engine = DendronEngine.getOrCreateEngine({
      root: opts.root,
      forceNew: true,
    });
    await engine.init();
    return engine;
  }
}
