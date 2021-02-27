import { DendronEngineV2 } from "@dendronhq/engine-server";
import { WorkspaceFolder } from "vscode-languageserver";

type DendronEngineServerOpts = {
  roots: WorkspaceFolder[];
};

export class DendronEngineServer {
  protected _engine?: DendronEngineV2;

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
    const engine = DendronEngineV2.create({
      wsRoot: root.uri,
    }) as DendronEngineV2;
    this._engine = engine;
    this._engine.init();
  }
}
