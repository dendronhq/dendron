import {
  DVault,
  normalizeUnixPath,
  NoteProps,
  VaultUtils,
  type ReducedDEngine,
} from "@dendronhq/common-all";
import _ from "lodash";
import { inject, injectable } from "tsyringe";
import vscode from "vscode";
import { URI, Utils } from "vscode-uri";

@injectable()
export class WSUtilsWeb {
  constructor(
    @inject("ReducedDEngine")
    private engine: ReducedDEngine,
    @inject("wsRoot") private wsRoot: URI,
    @inject("vaults") private vaults: DVault[]
  ) {}

  getVaultFromDocument(document: vscode.TextDocument) {
    const txtPath = document.uri.fsPath;
    const vault = VaultUtils.getVaultByFilePath({
      wsRoot: normalizeUnixPath(this.wsRoot.fsPath),
      vaults: this.vaults,
      fsPath: normalizeUnixPath(txtPath),
    });
    return vault;
  }

  public getNoteFromDocument(document: vscode.TextDocument) {
    const txtPath = document.uri;
    const fname = Utils.basename(txtPath).slice(0, -3); //remove .md;
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

  /**
   * Returns a URI for a given fname/vault combination. Note - this will return
   * a URI, even if a valid note doesn't exist at the specified location/vault.
   * @param fname
   * @param vault
   */
  public async getURIForNote(fname: string, vault: DVault) {
    return Utils.joinPath(
      this.wsRoot,
      VaultUtils.getRelPath(vault),
      fname + ".md"
    );
  }
}
