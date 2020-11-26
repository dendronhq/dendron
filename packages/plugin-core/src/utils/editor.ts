import _ from "lodash";
import vscode, { Position, Range, Selection, TextEditor } from "vscode";
import { VSCodeUtils } from "../utils";

export function isAnythingSelected(): boolean {
  return !vscode.window?.activeTextEditor?.selection?.isEmpty;
}

export function isHeaderSelection(
  selection: Selection,
  editor: TextEditor
): undefined | string {
  // multi-line
  if (selection.start.line !== selection.end.line) {
    return undefined;
  }
  const lineRange = new Range(
    new Position(selection.start.line, 0),
    new Position(selection.start.line + 1, 0)
  );
  const headerText = _.trim(editor.document.getText(lineRange));
  if (headerText.startsWith("#")) {
    return headerText;
  } else {
    return undefined;
  }
}

export function getHeaderFromSelection(opts?: { clean: boolean }) {
  const { text, selection, editor } = VSCodeUtils.getSelection();
  if (!_.isUndefined(selection) && !_.isEmpty(text) && !_.isUndefined(editor)) {
    let maybeHeaderText = isHeaderSelection(selection, editor);
    if (opts?.clean && maybeHeaderText) {
      maybeHeaderText = _.trim(_.trimStart(maybeHeaderText, "#"));
    }
    return { header: maybeHeaderText, selection };
  }
  return { header: undefined, selection };
}
