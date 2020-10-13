import { DendronEngineClient } from "@dendronhq/engine-server";
import path from "path";
import { DendronWorkspace } from "../workspace";

export class EngineAPIService extends DendronEngineClient {
  static create({ port }: { port: number | string }) {
    const vaults =
      DendronWorkspace.workspaceFolders()?.map((ent) => ent.uri.fsPath) || [];
    const ws = path.dirname(DendronWorkspace.workspaceFile().fsPath);
    return DendronEngineClient.create({ vaults, ws, port });
  }
}
