import vscode, { Uri } from "vscode";

export interface ISchemaSyncService {
  onDidSave({ document }: { document: vscode.TextDocument }): Promise<void>;

  saveSchema({
    uri,
    isBrandNewFile,
  }: {
    uri: Uri;
    isBrandNewFile?: boolean;
  }): Promise<void>;
}
