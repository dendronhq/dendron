import {
  DNoteRefData,
  DNoteRefLink,
  NotePropsV2,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import { refLink2Stringv2 } from "@dendronhq/engine-server";
import _ from "lodash";
import { Position, Range, Selection, TextEditor, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { clipboard, VSCodeUtils } from "../utils";
import { getHeaderFromSelection } from "../utils/editor";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = string;

export class CopyNoteRefCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.COPY_NOTE_REF.key;
  async sanityCheck() {
    if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
      return "No document open";
    }
    return;
  }

  async showFeedback(link: string) {
    window.showInformationMessage(`${link} copied`);
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
    let refLinkString: string = refLink2Stringv2(link);
    const { header, selection } = getHeaderFromSelection();
    if (header && selection) {
      linkData.anchorStart = header;
      if (this.hasNextHeader({ selection })) {
        linkData.anchorEnd = "*";
      }
      linkData.anchorStartOffset = 1;
      refLinkString = refLink2Stringv2(link);
    }
    return refLinkString;
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
      clipboard.writeText(link);
    } catch (err) {
      this.L.error({ err, link });
      throw err;
    }
    this.showFeedback(link);
    return link;
  }
}
