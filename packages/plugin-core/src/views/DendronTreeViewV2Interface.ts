import vscode from "vscode";
import { NoteProps } from "@dendronhq/common-all";

export interface IDendronTreeViewV2 {
  onOpenTextDocument(editor: vscode.TextEditor | undefined): Promise<void>;

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): Promise<void>;

  refresh(note: NoteProps): void;
}
