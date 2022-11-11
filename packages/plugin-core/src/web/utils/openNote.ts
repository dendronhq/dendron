import {
  assertUnreachable,
  DNoteAnchorBasic,
  DVault,
  getSlugger,
  NotePropsMeta,
  VaultUtils,
} from "@dendronhq/common-all";
import { Position, Selection, TextEditor, ViewColumn } from "vscode";
import * as vscode from "vscode";
import { URI, Utils } from "vscode-uri";
import { AnchorUtils } from "@dendronhq/unified";
import _ from "lodash";

export async function openNote({
  wsRoot,
  fname,
  vault,
  anchor,
  column,
  note,
}: {
  wsRoot: URI;
  fname: string;
  vault: DVault;
  note: NotePropsMeta;
  anchor?: DNoteAnchorBasic;
  column?: ViewColumn;
}) {
  const doc = await vscode.workspace.openTextDocument(
    // TODO: Replace with getURIForNote utils method
    Utils.joinPath(wsRoot, VaultUtils.getRelPath(vault), fname + ".md")
  );

  const editor = await vscode.window.showTextDocument(doc, column);

  if (anchor) {
    const pos = findAnchorPos({ anchor, note });
    editor.selection = new Selection(pos, pos);
    editor.revealRange(editor.selection);
  }
}

// Borrowed from WSUtilsV2.ts
export async function trySelectRevealNonNoteAnchor(
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

// Borrowed from GoToNote.ts
export const findAnchorPos = (opts: {
  anchor: DNoteAnchorBasic;
  note: NotePropsMeta;
}): Position => {
  const { anchor: findAnchor, note } = opts;
  let key: string;
  switch (findAnchor.type) {
    case "line":
      return new Position(findAnchor.line - 1, 0);
    case "block":
      key = `^${findAnchor.value}`;
      break;
    case "header":
      key = getSlugger().slug(findAnchor.value);
      break;
    default:
      assertUnreachable(findAnchor);
  }

  const found = note.anchors[key];

  if (_.isUndefined(found)) return new Position(0, 0);
  return new Position(found.line, found.column);
};
