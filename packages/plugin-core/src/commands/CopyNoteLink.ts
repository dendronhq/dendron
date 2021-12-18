import {
  isBlockAnchor,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { isInsidePath } from "@dendronhq/common-server";
import { AnchorUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { TextEditor, window } from "vscode";
import { DendronClientUtilsV2 } from "../clientUtils";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { clipboard } from "../utils";
import { getSelectionAnchors } from "../utils/editor";
import { VSCodeUtils } from "../vsCodeUtils";
import { getDWorkspace, getEngine } from "../workspace";
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

  private async createNonNoteFileLink(editor: TextEditor) {
    const { wsRoot, vaults } = getDWorkspace();
    let { fsPath } = editor.document.uri;
    // Find it relative to wsRoot
    fsPath = path.relative(wsRoot, fsPath);
    // Check if the file is in the assets of any vault. If it is, we can shorten the link.
    for (const vault of vaults) {
      const vaultPath = path.join(VaultUtils.getRelPath(vault), "assets");
      if (isInsidePath(vaultPath, fsPath)) {
        fsPath = path.relative(VaultUtils.getRelPath(vault), fsPath);
        break;
      }
    }
    let anchor = "";
    if (!editor.selection.isEmpty) {
      const line = editor.selection.start.line + 1; // line anchors are 1-indexed, vscode is 0
      // If the user selected a range, then we'll create a link with a line anchor
      anchor = `#${AnchorUtils.anchor2string({
        type: "line",
        line,
        value: line.toString(),
      })}`;
    }
    return `[[${fsPath}${anchor}]]`;
  }

  private async createNoteLink(editor: TextEditor, note: NoteProps) {
    const { selection } = VSCodeUtils.getSelection();
    const { startAnchor: anchor } = await getSelectionAnchors({
      editor,
      selection,
      engine: getEngine(),
      doEndAnchor: false,
    });

    return NoteUtils.createWikiLink({
      note,
      anchor: _.isUndefined(anchor)
        ? undefined
        : {
            value: anchor,
            type: isBlockAnchor(anchor) ? "blockAnchor" : "header",
          },
      useVaultPrefix: DendronClientUtilsV2.shouldUseVaultPrefix(getEngine()),
      alias: { mode: "title" },
    });
  }

  async execute(_opts: CommandOpts) {
    const editor = VSCodeUtils.getActiveTextEditor()!;
    const fname = NoteUtils.uri2Fname(editor.document.uri);

    const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
    const notes = getEngine().notes;
    const note = NoteUtils.getNoteByFnameV5({
      fname,
      vault,
      notes,
      wsRoot: getDWorkspace().wsRoot,
    }) as NoteProps;
    let link: string;
    if (note) {
      link = await this.createNoteLink(editor, note);
    } else {
      link = await this.createNonNoteFileLink(editor);
    }

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
