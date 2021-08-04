import { isBlockAnchor, NoteProps, NoteUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { TextEditor, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { clipboard, DendronClientUtilsV2, VSCodeUtils } from "../utils";
import { getSelectionAnchors } from "../utils/editor";
import { DendronWorkspace, getEngine } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = string;

export class CopyNoteLinkCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.COPY_NOTE_LINK.key;
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

    const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
    const notes = getEngine().notes;
    const note = NoteUtils.getNoteByFnameV5({
      fname,
      vault,
      notes,
      wsRoot: DendronWorkspace.wsRoot(),
    }) as NoteProps;
    if (!note) {
      throw Error(
        `${fname} not found in engine! Try saving this file and running "Dendron: Reload Index"`
      );
    }

    const { selection } = VSCodeUtils.getSelection();
    const { startAnchor: anchor } = await getSelectionAnchors({
      editor,
      selection,
      engine: getEngine(),
      doEndAnchor: false,
    });

    const link = NoteUtils.createWikiLink({
      note,
      anchor: _.isUndefined(anchor)
        ? undefined
        : {
            value: anchor,
            type: isBlockAnchor(anchor) ? "blockAnchor" : "header",
          },
      useVaultPrefix: DendronClientUtilsV2.shouldUseVaultPrefix(getEngine()),
    });
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
