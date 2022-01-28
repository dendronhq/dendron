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

  openFileInEditorUsingFullFname(
    vault: DVault,
    fnameWithExtension: string
  ): Promise<vscode.TextEditor>;

  openNote(note: NoteProps): Promise<vscode.TextEditor>;
}
