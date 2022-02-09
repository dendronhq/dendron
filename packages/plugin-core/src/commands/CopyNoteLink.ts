import {
  assertUnreachable,
  ConfigUtils,
  genUUIDInsecure,
  isBlockAnchor,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { isInsidePath } from "@dendronhq/common-server";
import { AnchorUtils, DConfig } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { TextEditor, window } from "vscode";
import { DendronClientUtilsV2 } from "../clientUtils";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { ExtensionProvider } from "../ExtensionProvider";
import { clipboard } from "../utils";
import { getBlockAnchorAt, getSelectionAnchors } from "../utils/editor";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput = {
  link: string;
  type: string;
};

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

  private async getUserLinkAnchorPreference(): Promise<
    "line" | "block" | null
  > {
    const { config, wsRoot } = ExtensionProvider.getDWorkspace();
    let anchorType = ConfigUtils.getNonNoteLinkAnchorType(config);
    if (anchorType === undefined) {
      // The preferred anchor type is not set, so ask the user if they want line numbers or block anchors
      const preference = await window.showQuickPick(
        [
          {
            label: "block",
            description: "Use block anchors like `^fx2d`",
            detail:
              "Links will always point to the right place, but Dendron must insert a short comment into the file.",
          },
          {
            label: "line",
            description: "Use line numbers `L123`",
            detail: "Links may point to the wrong place once code is changed.",
          },
        ],
        {
          canPickMany: false,
          ignoreFocusOut: true,
          title:
            "What type of anchors should Dendron create for links in non-note files?",
        }
      );
      // User cancelled the prompt
      if (preference?.label !== "line" && preference?.label !== "block") {
        return null;
      }
      anchorType = preference.label;
      // Otherwise, apply the selection and save the config
      ConfigUtils.setNonNoteLinkAnchorType(config, anchorType);
      await DConfig.writeConfig({ wsRoot, config });
      // Inform the user that this is the default now
      window.showInformationMessage(
        `Dendron will use ${anchorType} anchors in files that are not notes. If you would like to change this later, you can use the ${DENDRON_COMMANDS.CONFIGURE_RAW.title}.`
      );
    }
    return anchorType;
  }

  private async createNonNoteFileLink(editor: TextEditor) {
    const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();
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
    // If a range is selected, then we're making a link to the start of the selected range
    if (!editor.selection.isEmpty) {
      // First check if there's already a block anchor where the user selected.
      // If there is, we'll just use the existing anchor.
      const foundAnchor = getBlockAnchorAt({
        editor,
        position: editor.selection.start,
      });
      if (foundAnchor !== undefined) {
        anchor = `#${foundAnchor}`;
      } else {
        // Otherwise, we need to create the correct link based on user preference.
        const anchorType = await this.getUserLinkAnchorPreference();
        if (anchorType === "line" || anchorType === null) {
          // If the user prefers line anchors (or they cancelled the prompt), generate a line number anchor.
          // This is used for cancelled prompts too since it's a safe operation, it won't modify the file.
          const line = editor.selection.start.line + 1; // line anchors are 1-indexed, vscode is 0
          anchor = `#${AnchorUtils.anchor2string({
            type: "line",
            line,
            value: line.toString(),
          })}`;
        } else if (anchorType === "block") {
          // If the user prefers block anchors, we need to add the anchor to the file first
          const { line } = editor.selection.start;
          const endOfSelectedLine = editor.document.lineAt(line).range.end;
          const anchorText = AnchorUtils.anchor2string({
            type: "block",
            value: genUUIDInsecure(),
          });
          anchor = `#${anchorText}`;
          await editor.edit((builder) => {
            builder.insert(endOfSelectedLine, ` ${anchorText}`);
          });
        } else assertUnreachable(anchorType);
      }
    }
    return `[[${fsPath}${anchor}]]`;
  }

  private async createNoteLink(editor: TextEditor, note: NoteProps) {
    const engine = ExtensionProvider.getEngine();
    const { selection } = VSCodeUtils.getSelection();
    const { startAnchor: anchor } = await getSelectionAnchors({
      editor,
      selection,
      engine,
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
      useVaultPrefix: DendronClientUtilsV2.shouldUseVaultPrefix(engine),
      alias: { mode: "title" },
    });
  }

  addAnalyticsPayload(_opts: CommandOpts, resp: CommandOutput) {
    return { type: resp.type };
  }

  async execute(_opts: CommandOpts) {
    const editor = VSCodeUtils.getActiveTextEditor()!;
    const fname = NoteUtils.uri2Fname(editor.document.uri);
    const engine = ExtensionProvider.getEngine();

    const vault = PickerUtilsV2.getVaultForOpenEditor();
    const note = NoteUtils.getNoteByFnameFromEngine({
      fname,
      vault,
      engine,
    }) as NoteProps;
    let link: string;
    let type: string;
    if (note) {
      link = await this.createNoteLink(editor, note);
      type = "note";
    } else {
      link = await this.createNonNoteFileLink(editor);
      type = "non-note";
    }

    try {
      clipboard.writeText(link);
    } catch (err) {
      this.L.error({ err, link });
      throw err;
    }
    this.showFeedback(link);
    return { link, type };
  }
}
