import { TextEditor } from "vscode";

export interface IWindowWatcher {
  /**
   * Decorate wikilinks, user tags etc. as well as warning about some issues like missing frontmatter
   */
  triggerUpdateDecorations(editor: TextEditor): Promise<void>;

  /**
   * Show note preview panel if applicable
   */
  triggerNotePreviewUpdate({ document }: TextEditor): Promise<void>;
}
