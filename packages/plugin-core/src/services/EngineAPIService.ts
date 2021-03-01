import { DendronEngineClient, HistoryService } from "@dendronhq/engine-server";
import path from "path";
import { DendronWorkspace } from "../workspace";

export class EngineAPIService extends DendronEngineClient {
  static create({ port }: { port: number | string }) {
    const vaults = DendronWorkspace.instance().vaultsv4 || [];
    const ws = path.dirname(DendronWorkspace.workspaceFile().fsPath);
    const history = HistoryService.instance();
    return DendronEngineClient.create({ ws, port, history, vaults });
  }
}
