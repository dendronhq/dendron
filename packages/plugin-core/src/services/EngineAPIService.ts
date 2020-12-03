import { DendronEngineClient, HistoryService } from "@dendronhq/engine-server";
import path from "path";
import { DendronWorkspace } from "../workspace";

export class EngineAPIService extends DendronEngineClient {
  static create({ port }: { port: number | string }) {
    const vaults =
      DendronWorkspace.instance().vaults?.map((ent) => ent.fsPath) || [];
    const ws = path.dirname(DendronWorkspace.workspaceFile().fsPath);
    const history = HistoryService.instance();
    return DendronEngineClient.create({ vaults, ws, port, history });
  }
}
