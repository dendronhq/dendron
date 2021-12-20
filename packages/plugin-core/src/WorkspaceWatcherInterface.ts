import {
  ExtensionContext,
  FileRenameEvent,
  FileWillRenameEvent,
  TextDocument,
  TextDocumentChangeEvent,
  TextDocumentWillSaveEvent,
  TextEdit,
} from "vscode";

export interface IWorkspaceWatcher {
  activate(context: ExtensionContext): void;

  onDidSaveTextDocument(document: TextDocument): Promise<void>;

  /** This version of `onDidChangeTextDocument` is debounced for a longer time, and is useful for engine changes that should happen more slowly. */
  onDidChangeTextDocument(event: TextDocumentChangeEvent): Promise<void>;

  /** This version of `onDidChangeTextDocument` is debounced for a shorter time, and is useful for UI updates that should happen quickly. */
  quickOnDidChangeTextDocument(event: TextDocumentChangeEvent): Promise<void>;

  onDidOpenTextDocument(document: TextDocument): void;

  onWillSaveTextDocument(
    event: TextDocumentWillSaveEvent
  ): Promise<{ changes: TextEdit[] }>;

  onWillSaveNote(
    event: TextDocumentWillSaveEvent
  ): { changes: any[] } | { changes: TextEdit[] };

  /** Do not use this function, please go to `WindowWatcher.onFirstOpen() instead.`
   *
   * Checks if the given document has been opened for the first time during this session, and marks the document as being processed.
   *
   * Certain actions (such as folding and adjusting the cursor) need to be done only the first time a document is opened.
   * While the `WorkspaceWatcher` sees when new documents are opened, the `TextEditor` is not active at that point, and we can not
   * perform these actions. This code allows `WindowWatcher` to check when an editor becomes active whether that editor belongs to an
   * newly opened document.
   *
   * Mind that this method is not idempotent, checking the same document twice will always return false for the second time.
   */
  getNewlyOpenedDocument(document: TextDocument): boolean;

  /**
   * method to make modifications to the workspace before the file is renamed.
   * It updates all the references to the oldUri
   */
  onWillRenameFiles(args: FileWillRenameEvent): void;

  /**
   * method to make modifications to the workspace after the file is renamed.
   * It updates the title of the note wrt the new fname and refreshes tree view
   */
  onDidRenameFiles(args: FileRenameEvent): Promise<void>;
}
