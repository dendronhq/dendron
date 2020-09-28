import { getStage } from "@dendronhq/common-all";
import { IConnection, WorkspaceFolder } from "vscode-languageserver";
import { getSettings } from "./settings";
import path from "path";
import { URI } from "vscode-uri";

export class LSPUtils {
  static connection: IConnection | null;

  static instance(connection?: IConnection) {
    if (connection) {
      this.connection = connection;
    }
  }

  static async wsFolders(): Promise<WorkspaceFolder[] | null> {
    if (getStage() === "test") {
      const uri = path.join(getSettings().wsRoot, "vault");
      return [{ uri, name: "vault" }];
    }
    return await (this
      .connection as IConnection).workspace.getWorkspaceFolders();
  }

  static log(msg: any) {
    LSPUtils.connection?.console.log(JSON.stringify(msg));
  }
}
