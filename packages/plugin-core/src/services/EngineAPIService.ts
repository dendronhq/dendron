import { DendronEngineClient } from "@dendronhq/engine-server";
import path from "path";
import { DendronWorkspace } from "../workspace";

export class EngineAPIService extends DendronEngineClient {
  static create({ port }: { port: number | string }) {
    const vaults =
      DendronWorkspace.instance().config.vaults?.map((ent) => ent.fsPath) || [];
    const ws = path.dirname(DendronWorkspace.workspaceFile().fsPath);
    return DendronEngineClient.create({ vaults, ws, port });
  }
}
