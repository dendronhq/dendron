import { DVault, NoteProps, VaultUtils } from "@dendronhq/common-all";
import { IReducedEngineAPIService } from "@dendronhq/plugin-common";
import path from "path";
import vscode from "vscode";
import { URI } from "vscode-uri";

export class WSUtilsWeb {
  // eslint-disable-next-line no-useless-constructor
  constructor(
    private _engine: IReducedEngineAPIService,
    private wsRoot: URI,
    private vaults: DVault[]
  ) {}

  private getVaultFromDocument(document: vscode.TextDocument) {
    const txtPath = document.uri.fsPath;
    const vault = VaultUtils.getVaultByFilePath({
      wsRoot: this.wsRoot.fsPath,
      vaults: this.vaults,
      fsPath: txtPath,
    });
    return vault;
  }

  private getNoteFromDocument(document: vscode.TextDocument) {
    const txtPath = document.uri.fsPath;
    const fname = path.basename(txtPath, ".md");
    let vault: DVault;
    try {
      vault = this.getVaultFromDocument(document);
    } catch (err) {
      // No vault
      return undefined;
    }

    return this._engine.findNotes({
      fname,
      vault,
    });
  }

  async getActiveNote(): Promise<NoteProps | undefined> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return undefined;
    }

    const notes = await this.getNoteFromDocument(editor.document);

    if (!notes || notes.length !== 1) {
      return undefined;
    }

    return notes[0];
  }
}
