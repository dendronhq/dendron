import vscode, { Uri } from "vscode";
import { DVault, NoteProps } from "@dendronhq/common-all";

export interface IWSUtilsV2 {
  getNoteFromDocument(document: vscode.TextDocument): undefined | NoteProps;

  getVaultFromDocument(document: vscode.TextDocument): DVault;

  tryGetNoteFromDocument(document: vscode.TextDocument): NoteProps | undefined;

  getActiveNote(): NoteProps | undefined;

  getVaultFromUri(fileUri: Uri): DVault;

  getVaultFromPath(fsPath: string): DVault;

  getNoteFromPath(fsPath: string): NoteProps | undefined;

  /** If the text document at `filePath` is open in any editor, return that document. */
  getMatchingTextDocument(filePath: string): vscode.TextDocument | undefined;

  /**
   * Find note by fname across all vaults.
   *
   * If vault is specified, search notes by corresponding vault and fname. If no match, return undefined.
   * If vault is not specified, search all notes by id.
   *    - If no match, return undefined
   *    - If one match, assume that is intended note and return.
   *    - If multiple matches, prompt user to select vault from matches
   */
  getNoteFromMultiVault(opts: {
    fname: string;
    vault?: DVault;
  }): Promise<NoteProps | undefined>;
}
