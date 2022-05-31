import vscode, { TextEditor, Uri } from "vscode";
import {
  DNoteAnchorBasic,
  DVault,
  NoteProps,
  RespV3,
} from "@dendronhq/common-all";

export interface IWSUtilsV2 {
  getNoteFromDocument(document: vscode.TextDocument): undefined | NoteProps;

  getVaultFromDocument(document: vscode.TextDocument): DVault;

  tryGetNoteFromDocument(document: vscode.TextDocument): NoteProps | undefined;

  trySelectRevealNonNoteAnchor(
    editor: TextEditor,
    anchor: DNoteAnchorBasic
  ): Promise<void>;

  getActiveNote(): NoteProps | undefined;

  getVaultFromUri(fileUri: Uri): DVault;

  getVaultFromPath(fsPath: string): DVault;

  getNoteFromPath(fsPath: string): NoteProps | undefined;

  /** If the text document at `filePath` is open in any editor, return that document. */
  getMatchingTextDocument(filePath: string): vscode.TextDocument | undefined;

  openFileInEditorUsingFullFname(
    vault: DVault,
    fnameWithExtension: string
  ): Promise<vscode.TextEditor>;

  openNote(note: NoteProps): Promise<vscode.TextEditor>;

  /**
   * Find note by fname across all vaults.
   *
   * If vault is specified, search notes by corresponding vault and fname. If no match, return undefined.
   * If vault is not specified, search all notes by id.
   *    - If no match, return error about missing note
   *    - If one match, assume that is intended note and return.
   *    - If multiple matches, prompt user via quickpick to select vault from matches. If user escapes out, return undefined
   *
   * @param fname: name of note to look for
   * @param quickpickTitle: title of quickpick to display if multiple matches are found
   * @param nonStubOnly?: if provided, boolean to determine whether to return non-stub notes only. Default behavior is to return all
   * @param vault?: if provided, vault to search note from
   */
  findNoteFromMultiVaultAsync(opts: {
    fname: string;
    quickpickTitle: string;
    nonStubOnly?: boolean;
    vault?: DVault;
  }): Promise<RespV3<NoteProps | undefined>>;
}
