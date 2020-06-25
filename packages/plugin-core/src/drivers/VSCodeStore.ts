import { Uri, window, workspace } from "vscode";

import { FileStorageBase } from "@dendronhq/engine-server";

export class VSCodeStorage extends FileStorageBase {
  async doGetFile(id: string) {
    const { root } = this.opts;
    const fpath = this.idToPath[id];
    const selectedFile = Uri.file(fpath);
    const document = await workspace.openTextDocument(selectedFile);
    window.showTextDocument(document);
    return document;
  }
}
