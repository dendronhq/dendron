import { DNodeUtils } from "@dendronhq/common-all";
import { resolvePath } from "@dendronhq/common-server";
import clipboardy from "clipboardy";
import _ from "lodash";
import { TextEditor } from "vscode";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";


type CommandOpts = {};
type CommandOutput = string;

export class CopyNoteLinkCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  public notesDirConfPath = resolvePath("~/.notesdir.conf.py");

  async sanityCheck() {
      if (_.isUndefined(VSCodeUtils.getActiveTextEditor())) {
          return "No document open"
      }
      return;
  }

  async execute(_opts: CommandOpts) {
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor
    const fname = DNodeUtils.uri2Fname(editor.document.uri);
    const note = _.find(DendronWorkspace.instance().engine.notes, {fname})
    if (!note) {
        throw Error(`${fname} not found in engine`)
    }
    const {title} = note;
    const link = `[[ ${title} | ${fname} ]]`;
    clipboardy.writeSync(link);
    return link;
  }
}
