import {
  DendronError,
  DNoteRefData,
  DNoteRefLink,
  getSlugger,
  isBlockAnchor,
  NotePropsMeta,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { refLink2Stringv2 } from "@dendronhq/engine-server";
import _ from "lodash";
import { Position, Range, Selection, TextEditor, window } from "vscode";
import { DendronClientUtilsV2 } from "../clientUtils";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { ExtensionProvider } from "../ExtensionProvider";
import { clipboard } from "../utils";
import { EditorUtils } from "../utils/EditorUtils";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = string;

export class CopyNoteRefCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.COPY_NOTE_REF.key;
  private extension: IDendronExtension;

  constructor(ext: IDendronExtension) {
    super();
    this.extension = ext;
  }

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

  async buildLink(opts: {
    note: NotePropsMeta;
    useVaultPrefix?: boolean;
    editor: TextEditor;
  }) {
    const { note, useVaultPrefix, editor } = opts;
    const { fname, vault } = note;
    const linkData: DNoteRefData = {
      type: "file",
    };
    const slugger = getSlugger();
    const { selection } = VSCodeUtils.getSelection();
    if (selection) {
      const { startAnchor, endAnchor } = await EditorUtils.getSelectionAnchors({
        editor,
        selection,
        engine: this.extension.getEngine(),
      });
      linkData.anchorStart = startAnchor;
      if (!_.isUndefined(startAnchor) && !isBlockAnchor(startAnchor)) {
        // if a header is selected, skip the header itself
        linkData.anchorStart = slugger.slug(startAnchor);
      }
      linkData.anchorEnd = endAnchor;
      if (!_.isUndefined(endAnchor) && !isBlockAnchor(endAnchor)) {
        linkData.anchorEnd = slugger.slug(endAnchor);
      }
    }
    const link: DNoteRefLink = {
      data: linkData,
      type: "ref",
      from: {
        fname,
        vaultName: VaultUtils.getName(vault),
      },
    };
    const refLinkString: string = refLink2Stringv2({
      link,
      useVaultPrefix,
      rawAnchors: true,
    });
    return refLinkString;
  }

  async execute(_opts: CommandOpts) {
    const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
    const fname = NoteUtils.uri2Fname(editor.document.uri);
    const vault = PickerUtilsV2.getVaultForOpenEditor();
    const { engine } = ExtensionProvider.getDWorkspace();
    const note = (await engine.findNotesMeta({ fname, vault }))[0];
    if (note) {
      const useVaultPrefix = DendronClientUtilsV2.shouldUseVaultPrefix(engine);
      const link = await this.buildLink({
        note,
        useVaultPrefix,
        editor,
      });
      try {
        clipboard.writeText(link);
      } catch (err) {
        this.L.error({ err, link });
        throw err;
      }
      this.showFeedback(link);
      return link;
    } else {
      throw new DendronError({ message: `note ${fname} not found` });
    }
  }
}
