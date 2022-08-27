import { DNoteAnchorBasic, DVault, VaultUtils } from "@dendronhq/common-all";
import { Position, Selection, TextEditor, ViewColumn } from "vscode";
import * as vscode from "vscode";
import { URI, Utils } from "vscode-uri";
import { AnchorUtils } from "@dendronhq/unified";

export async function openNote({
  wsRoot,
  fname,
  vault,
  anchor,
  column,
}: {
  wsRoot: URI;
  fname: string;
  vault: DVault;
  anchor?: DNoteAnchorBasic;
  column?: ViewColumn;
}) {
  const doc = await vscode.workspace.openTextDocument(
    // TODO: Replace with getURIForNote utils method
    Utils.joinPath(wsRoot, VaultUtils.getRelPath(vault), fname + ".md")
  );

  const editor = await vscode.window.showTextDocument(doc, column);

  if (anchor) {
    trySelectRevealNonNoteAnchor(editor, anchor);
  }
}

// Borrowed from WSUtilsV2.ts
async function trySelectRevealNonNoteAnchor(
  editor: TextEditor,
  anchor: DNoteAnchorBasic
): Promise<void> {
  let position: Position | undefined;
  switch (anchor.type) {
    case "line":
      // Line anchors are direct line numbers from the start
      position = new Position(anchor.line - 1 /* line 1 is index 0 */, 0);
      break;
    case "block":
      // We don't parse non note files for anchors, so read the document and find where the anchor is
      position = editor?.document.positionAt(
        editor?.document.getText().indexOf(AnchorUtils.anchor2string(anchor))
      );
      break;
    default:
      // not supported for non-note files
      position = undefined;
  }
  if (position) {
    // if we did find the anchor, then select and scroll to it
    editor.selection = new Selection(position, position);
    editor.revealRange(editor.selection);
  }
}
