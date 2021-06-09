import { genUUID } from "@dendronhq/common-all";
import { BLOCK_LINK_REGEX_LOOSE } from "@dendronhq/engine-server";
import _ from "lodash";
import vscode, {
  Position,
  Range,
  Selection,
  TextEditor,
  TextEditorEdit,
} from "vscode";

export function isAnythingSelected(): boolean {
  return !vscode.window?.activeTextEditor?.selection?.isEmpty;
}

/** Finds the header at the specified line, if any.
 *
 * @param editor the editor that has the document containing the header open
 * @param position the line where the header should be checked for
 * @returns the header text, or undefined if there wasn't a header
 */
export function getHeaderAt({
  editor,
  position,
}: {
  editor: TextEditor;
  position: Position;
}): undefined | string {
  const lineRange = new Range(
    new Position(position.line, 0),
    new Position(position.line + 1, 0)
  );
  const headerText = _.trim(editor.document.getText(lineRange));
  if (headerText.startsWith("#")) {
    // TODO: Need to use an actual parser here, otherwise headers with block anchors don't get parsed correctly.
    // e.g. `# foo ^anchor` eventually turns into `foo-^anchor` but the actual header anchor is just `foo`.
    return headerText.replace(/^#*/, "").trim();
  } else {
    return undefined;
  }
}

/** Finds the block anchor at the end of the specified line, if any.
 *
 * @param editor the editor that has the document containing the anchor open
 * @param position the line where the anchor should be checked for
 * @returns the anchor (with ^), or undefined if there wasn't an anchor
 */
export function getBlockAnchorAt({
  editor,
  position,
}: {
  editor: TextEditor;
  position: Position;
}): string | undefined {
  const line = editor.document.lineAt(position.line);
  const existingAnchor = line.text.match(BLOCK_LINK_REGEX_LOOSE.source + "$");
  if (!_.isNull(existingAnchor)) return existingAnchor[0];
  return undefined;
}

/** Add a block anchor at the end of the specified line. The anchor is randomly generated if not supplied.
 *
 * If there is already an anchor at the end of this line, then this function doesn't actually insert an anchor but returns that anchor instead.
 *
 * @param editBuilder parameter of the callback in `editor.edit`
 * @param editor the editor that the editBuilder belongs to
 * @param position the line where the anchor will be inserted
 * @param anchor anchor id to insert (without ^), randomly generated if undefined
 * @returns the anchor that has been added (with ^)
 */
export function addOrGetAnchorAt({
  editBuilder,
  editor,
  position,
  anchor,
}: {
  editBuilder: TextEditorEdit;
  editor: TextEditor;
  position: Position;
  anchor?: string;
}) {
  const line = editor.document.lineAt(position.line);
  const existingAnchor = getAnchorAt({ editor, position });
  if (!_.isUndefined(existingAnchor)) return existingAnchor;
  if (_.isUndefined(anchor)) anchor = genUUID(8);
  editBuilder.insert(line.range.end, ` ^${anchor}`);
  return `^${anchor}`;
}

/** Finds the header or block anchor at the end of the specified line, if any.
 *
 * @param editor the editor that has the document containing the anchor open
 * @param position the line where the anchor should be checked for
 * @returns the anchor (with ^), or undefined if there wasn't an anchor
 */
export function getAnchorAt(args: {
  editor: TextEditor;
  position: Position;
}): string | undefined {
  return getHeaderAt(args) || getBlockAnchorAt(args);
}

export async function getSelectionAnchors(opts: {
  editor: TextEditor;
  selection?: Selection;
  doStartAnchor?: boolean;
  doEndAnchor?: boolean;
}): Promise<{ startAnchor?: string; endAnchor?: string }> {
  const { editor, selection, doStartAnchor, doEndAnchor } = _.defaults(
    { doStartAnchor: true, doEndAnchor: true },
    opts
  );
  if (_.isUndefined(selection)) return {};
  let startAnchor = doStartAnchor
    ? getAnchorAt({ editor, position: selection.start })
    : undefined;
  if (selection.start.line === selection.end.line) return { startAnchor };
  // multi line

  let endAnchor = doEndAnchor
    ? getAnchorAt({ editor, position: selection.end })
    : undefined;
  // if we found both anchors already, just return them.
  if (!_.isUndefined(startAnchor) && !_.isUndefined(endAnchor))
    return { startAnchor, endAnchor };
  // otherwise, we'll need to edit the document to insert block anchors
  await editor.edit((editBuilder) => {
    if (_.isUndefined(startAnchor))
      startAnchor = addOrGetAnchorAt({
        editBuilder,
        editor,
        position: selection.start,
      });
    if (_.isUndefined(endAnchor))
      endAnchor = addOrGetAnchorAt({
        editBuilder,
        editor,
        position: selection.end,
      });
  });
  return { startAnchor, endAnchor };
}
