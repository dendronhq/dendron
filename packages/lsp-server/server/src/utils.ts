import { IConnection } from "vscode-languageserver";

export class LSPUtils {
  static connection: IConnection | null;

  static instance(connection?: IConnection) {
    if (connection) {
      this.connection = connection;
    }
  }

  static async wsFolders() {
    return await (this
      .connection as IConnection).workspace.getWorkspaceFolders();
  }
}
