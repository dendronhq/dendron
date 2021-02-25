import { NotePropsV2, NoteUtilsV2 } from "@dendronhq/common-all";
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
    const fname = NoteUtilsV2.uri2Fname(editor.document.uri);
    let note: NotePropsV2;

    const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
    note = NoteUtilsV2.getNoteByFnameV5({
      fname,
      vault,
      notes: getEngine().notes,
      wsRoot: DendronWorkspace.wsRoot(),
    }) as NotePropsV2;
    if (!note) {
      throw Error(`${fname} not found in engine`);
    }
    const { header } = getHeaderFromSelection({ clean: true });
    const link = NoteUtilsV2.createWikiLink({ note, header });
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
