import { DNodeUtils } from "@dendronhq/common-all";
import clipboardy from "clipboardy";
import _ from "lodash";
import { TextEditor, window } from "vscode";
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

  async execute(_opts: CommandOpts) {
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const fname = DNodeUtils.uri2Fname(editor.document.uri);
    const note = _.find(DendronWorkspace.instance().engine.notes, { fname });
    if (!note) {
      throw Error(`${fname} not found in engine`);
    }
    const link = `((ref:[[${fname}]]))`;
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
