import vscode from "vscode";
import { DVault, NoteProps } from "@dendronhq/common-all";

export interface INoteSyncService {
  /**
   * Performs tasks that should be run when the note is changed
   * - update note links
   * - update note anchors
   * - trigger engine update
   * - trigger preview sync
   * @param uri
   * @returns
   */
  onDidChange(
    document: vscode.TextDocument,
    hints?: { contentChanges: readonly vscode.TextDocumentContentChangeEvent[] }
  ): Promise<NoteProps | undefined>;

  updateNoteContents(opts: {
    oldNote: NoteProps;
    content: string;
    fmChangeOnly: boolean;
    fname: string;
    vault: DVault;
  }): Promise<NoteProps>;

  updateNoteMeta({
    note,
    fmChangeOnly,
  }: {
    note: NoteProps;
    fmChangeOnly: boolean;
  }): Promise<NoteProps>;
}
