import {
  DVault,
  type ReducedDEngine,
  NoteProps,
  VaultUtils,
} from "@dendronhq/common-all";
import path from "path";
import { inject, injectable } from "tsyringe";
import vscode from "vscode";
import { URI } from "vscode-uri";

@injectable()
export class WSUtilsWeb {
  constructor(
    @inject("ReducedDEngine")
    private engine: ReducedDEngine,
    @inject("wsRoot") private wsRoot: URI,
    @inject("vaults") private vaults: DVault[]
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

  public getNoteFromDocument(document: vscode.TextDocument) {
    const txtPath = document.uri.fsPath;
    const fname = path.basename(txtPath, ".md");
    let vault: DVault;
    try {
      vault = this.getVaultFromDocument(document);
    } catch (err) {
      // No vault
      return undefined;
    }

    return this.engine.findNotes({
      fname,
      vault,
    });
  }

  public async getActiveNote(): Promise<NoteProps | undefined> {
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
