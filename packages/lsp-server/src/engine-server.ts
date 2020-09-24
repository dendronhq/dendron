import { WorkspaceFolder } from "vscode-languageserver";
import { DendronEngine } from "@dendronhq/engine-server";

type DendronEngineServerOpts = {
  roots: WorkspaceFolder[];
};

export class DendronEngineServer {
  protected _engine?: DendronEngine;

  constructor(public opts: DendronEngineServerOpts) {}

  static _instance: DendronEngineServer | null;

  static getOrCreate(opts: DendronEngineServerOpts) {
    if (!DendronEngineServer._instance) {
      DendronEngineServer._instance = new DendronEngineServer(opts);
    }
    return DendronEngineServer._instance;
  }

  init() {
    const root = this.opts.roots[0];
    if (!root) {
      return;
    }
    const engine = DendronEngine.getOrCreateEngine({
      root: root.uri,
      forceNew: true,
    }) as DendronEngine;
    this._engine = engine;
    this._engine.init();
  }
}
