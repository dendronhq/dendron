import clipboardy from "@dendronhq/clipboardy";
import { NotePropsV2, NoteUtilsV2 } from "@dendronhq/common-all";
import _ from "lodash";
import { TextEditor, window } from "vscode";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = string;

export class CopyNoteLinkCommand extends BasicCommand<
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
    const fname = NoteUtilsV2.uri2Fname(editor.document.uri);
    let note: NotePropsV2;
    note = NoteUtilsV2.getNoteByFname(
      fname,
      DendronWorkspace.instance().getEngine().notes
    ) as NotePropsV2;
    if (!note) {
      throw Error(`${fname} not found in engine`);
    }
    const link = NoteUtilsV2.createWikiLink({ note });
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
