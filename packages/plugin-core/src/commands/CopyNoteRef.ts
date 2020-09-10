import { DNodeUtils } from "@dendronhq/common-all";
import clipboardy from "@dendronhq/clipboardy";
import _ from "lodash";
import { TextEditor, window, Selection } from "vscode";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";
import { DendronRefLink, refLink2String } from "@dendronhq/engine-server";

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

  isHeader(text: string, selection: Selection) {
      return text.startsWith("#")  && (selection.start.line === selection.end.line)
  }

  async buildLink(opts: {fname: string}) {
    const {fname} = opts;
    const link: DendronRefLink = {
      type: "file",
      name: fname,
    };
    const { text, selection } = VSCodeUtils.getSelection();
    let refLinkString: string = refLink2String(link);
    if (!_.isEmpty(text)) {
      if (this.isHeader(text, selection)) {
        const headerText = _.trim(text)
        link.anchorStart = headerText;
        link.anchorEnd = "*";
        link.anchorStartOffset = 1;
        refLinkString = refLink2String(link);
      } 
    } 
    return ["((", "ref: ", refLinkString, "))"].join("");
  }

  async execute(_opts: CommandOpts) {
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const fname = DNodeUtils.uri2Fname(editor.document.uri);
    const note = _.find(DendronWorkspace.instance().engine.notes, { fname });
    if (!note) {
      throw Error(`${fname} not found in engine`);
    }
    const link = await this.buildLink({fname});
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
