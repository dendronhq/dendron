import vscode, { TextEditor, Uri } from "vscode";
import {
  DNoteAnchorBasic,
  DVault,
  NoteProps,
  NotePropsMeta,
  RespV3,
  SchemaModuleProps,
} from "@dendronhq/common-all";

export interface IWSUtilsV2 {
  getNoteFromDocument(
    document: vscode.TextDocument
  ): Promise<undefined | NoteProps>;

  getVaultFromDocument(document: vscode.TextDocument): DVault;

  tryGetNoteFromDocument(
    document: vscode.TextDocument
  ): Promise<NoteProps | undefined>;

  trySelectRevealNonNoteAnchor(
    editor: TextEditor,
    anchor: DNoteAnchorBasic
  ): Promise<void>;

  getActiveNote(): Promise<NoteProps | undefined>;

  getVaultFromUri(fileUri: Uri): DVault;

  getVaultFromPath(fsPath: string): DVault;

  getNoteFromPath(fsPath: string): Promise<NoteProps | undefined>;

  /** If the text document at `filePath` is open in any editor, return that document. */
  getMatchingTextDocument(filePath: string): vscode.TextDocument | undefined;

  openFileInEditorUsingFullFname(
    vault: DVault,
    fnameWithExtension: string
  ): Promise<vscode.TextEditor>;

  openNote(note: NotePropsMeta): Promise<vscode.TextEditor>;
  openSchema(schema: SchemaModuleProps): Promise<vscode.TextEditor>;

  /**
   * Given list of notes, prompt user to pick note by selecting corresponding vault name
   *
   * For list of notes,
   *    - If length == 0, return error about no notes
   *    - If length == 1, assume that is intended note and return.
   *    - If length > 1, prompt user via quickpick to select vault from matches. If user escapes out, return undefined
   *
   * @param notes: list of notes for user to pick from
   * @param quickpickTitle: title of quickpick to display if multiple matches are found
   * @param nonStubOnly?: if provided, boolean to determine whether to return non-stub notes only. Default behavior is to return all
   */
  promptForNoteAsync(opts: {
    notes: NoteProps[];
    quickpickTitle: string;
    nonStubOnly?: boolean;
  }): Promise<RespV3<NoteProps | undefined>>;
}
