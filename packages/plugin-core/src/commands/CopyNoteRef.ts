import clipboardy from "@dendronhq/clipboardy";
import {
  DNoteRefData,
  DNoteRefLink,
  NotePropsV2,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import { refLink2String } from "@dendronhq/engine-server";
import _ from "lodash";
import { Position, Range, Selection, TextEditor, window } from "vscode";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = string;

export class CopyNoteRefCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  async showFeedback(link: string) {
    window.showInformationMessage(`${link} copied`);
  }

  isHeader(selection: Selection, editor: TextEditor): false | string {
    // multi-line
    if (selection.start.line !== selection.end.line) {
      return false;
    }
    const lineRange = new Range(
      new Position(selection.start.line, 0),
      new Position(selection.start.line + 1, 0)
    );
    const headerText = _.trim(editor.document.getText(lineRange).slice(0, -1));
    if (headerText.startsWith("#")) {
      return headerText;
    } else {
      return false;
    }
  }

  hasNextHeader(opts: { selection: Selection }) {
    const { selection } = opts;
    const lineEndForSelection = selection.end.line;
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const lineEndForDoc = editor.document.lineCount;
    const text = editor.document.getText(
      new Range(
        new Position(lineEndForSelection + 1, 0),
        new Position(lineEndForDoc, 0)
      )
    );
    return !_.isNull(text.match(/^#+\s/m));
  }

  async buildLink(opts: { fname: string }) {
    const { fname } = opts;
    const linkData: DNoteRefData = {
      type: "file",
    };
    const link: DNoteRefLink = {
      data: linkData,
      type: "ref",
      from: {
        fname,
      },
    };
    const { text, selection, editor } = VSCodeUtils.getSelection();
    let refLinkString: string = refLink2String(link);
    if (
      !_.isUndefined(selection) &&
      !_.isEmpty(text) &&
      !_.isUndefined(editor)
    ) {
      const maybeHeaderText = this.isHeader(selection, editor);
      if (maybeHeaderText) {
        linkData.anchorStart = maybeHeaderText;
        if (this.hasNextHeader({ selection })) {
          linkData.anchorEnd = "*";
        }
        linkData.anchorStartOffset = 1;
        refLinkString = refLink2String(link);
      }
    }
    return ["((", "ref: ", refLinkString, "))"].join("");
  }

  async execute(_opts: CommandOpts) {
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const fname = NoteUtilsV2.uri2Fname(editor.document.uri);
    let note: NotePropsV2 | undefined;
    note = _.find(DendronWorkspace.instance().getEngine().notes, { fname });
    if (!note) {
      throw Error(`${fname} not found in engine`);
    }
    const link = await this.buildLink({ fname });
    try {
      clipboardy.writeSync(link);
    } catch (err) {
      this.L.error({ err, link });
      throw err;
    }
    this.showFeedback(link);
    return link;
  }
}
