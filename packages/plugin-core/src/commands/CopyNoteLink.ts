import { NoteProps, NoteUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { TextEditor, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { clipboard, VSCodeUtils } from "../utils";
import { getHeaderFromSelection } from "../utils/editor";
import { DendronWorkspace, getEngine } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = string;

export class CopyNoteLinkCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.COPY_NOTE_LINK.key;
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
    const fname = NoteUtils.uri2Fname(editor.document.uri);
    let note: NoteProps;

    const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
    note = NoteUtils.getNoteByFnameV5({
      fname,
      vault,
      notes: getEngine().notes,
      wsRoot: DendronWorkspace.wsRoot(),
    }) as NoteProps;
    if (!note) {
      throw Error(`${fname} not found in engine`);
    }
    const { header } = getHeaderFromSelection({ clean: true });
    const useVaultPrefix = _.size(getEngine().vaultsv3) > 1;
    const link = NoteUtils.createWikiLink({ note, header, useVaultPrefix });
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
