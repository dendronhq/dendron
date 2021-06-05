import {
  DNoteRefData,
  DNoteRefLink,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { refLink2Stringv2 } from "@dendronhq/engine-server";
import _ from "lodash";
import { Position, Range, Selection, TextEditor, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { clipboard, VSCodeUtils } from "../utils";
import { getHeaderFromSelection } from "../utils/editor";
import { DendronWorkspace, getEngine } from "../workspace";
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

  async buildLink(opts: { note: NoteProps; useVaultPrefix?: boolean }) {
    const { note, useVaultPrefix } = opts;
    const { fname, vault } = note;
    const linkData: DNoteRefData = {
      type: "file",
    };
    const link: DNoteRefLink = {
      data: linkData,
      type: "ref",
      from: {
        fname,
        vaultName: VaultUtils.getName(vault),
      },
    };
    let refLinkString: string = refLink2Stringv2({ link, useVaultPrefix });
    const { header, selection } = getHeaderFromSelection();
    if (header && selection) {
      linkData.anchorStart = header;
      if (this.hasNextHeader({ selection })) {
        linkData.anchorEnd = "*";
      }
      linkData.anchorStartOffset = 1;
      refLinkString = refLink2Stringv2({ link, useVaultPrefix });
    }
    return refLinkString;
  }

  async execute(_opts: CommandOpts) {
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const fname = NoteUtils.uri2Fname(editor.document.uri);
    const wsRoot = DendronWorkspace.wsRoot();
    const vault = PickerUtilsV2.getVaultForOpenEditor();
    let note: NoteProps = NoteUtils.getNoteOrThrow({
      fname,
      notes: getEngine().notes,
      wsRoot,
      vault,
    });
    const useVaultPrefix = _.size(getEngine().vaults) > 1;
    const link = await this.buildLink({ note, useVaultPrefix });
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
