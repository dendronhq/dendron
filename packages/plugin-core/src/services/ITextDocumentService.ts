import { NoteProps } from "@dendronhq/common-all";
import { Disposable, TextDocument, TextDocumentChangeEvent } from "vscode";

/**
 * Interface for a service that processes text document changes from vscode.
 */
export interface ITextDocumentService extends Disposable {
  /**
   * Process content changes from TextDocumentChangeEvent and return an updated note prop.
   *
   * Return undefined if changes cannot be processed (such as missing frontmatter or dirty changes) or if no changes have been detected
   *
   * @param event Event containing document changes
   * @return NoteProps
   */
  processTextDocumentChangeEvent(
    event: TextDocumentChangeEvent
  ): Promise<NoteProps | undefined>;

  /**
   * Apply content from a TextDocument to an existing note
   *
   * @param note Existing note to update
   * @param textDocument TextDocument representation of note. May or may not have content changes from note
   * @return New NoteProps with updated contents from TextDocument
   */
  applyTextDocumentToNoteProps(
    note: NoteProps,
    textDocument: TextDocument
  ): Promise<NoteProps>;
}
