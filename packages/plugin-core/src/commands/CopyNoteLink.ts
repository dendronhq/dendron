import {
  assertUnreachable,
  ConfigService,
  ConfigUtils,
  genUUIDInsecure,
  isBlockAnchor,
  isLineAnchor,
  NoteChangeEntry,
  NotePropsMeta,
  NoteUtils,
  URI,
  VaultUtils,
} from "@dendronhq/common-all";
import { isInsidePath } from "@dendronhq/common-server";
import { AnchorUtils } from "@dendronhq/unified";
import _ from "lodash";
import path from "path";
import { Disposable, TextEditor, window } from "vscode";
import { DendronClientUtilsV2 } from "../clientUtils";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { clipboard } from "../utils";
import { EditorUtils } from "../utils/EditorUtils";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = {};
type CommandOutput =
  | {
      link: string;
      type: string;
      anchorType?: string;
    }
  | undefined;

export class CopyNoteLinkCommand
  extends BasicCommand<CommandOpts, CommandOutput>
  implements Disposable
{
  static requireActiveWorkspace: boolean = true;
  key = DENDRON_COMMANDS.COPY_NOTE_LINK.key;
  private extension: IDendronExtension;
  private _onEngineNoteStateChangedDisposable: Disposable | undefined;

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

  private async getUserLinkAnchorPreference(): Promise<"line" | "block"> {
    const config = await this.extension.getDWorkspace().config;
    let anchorType = ConfigUtils.getNonNoteLinkAnchorType(config);
    if (anchorType === "prompt") {
      // The preferred anchor type is not set, so ask the user if they want line numbers or block anchors
      const preference = await window.showQuickPick(
        [
          {
            label: "block",
            description: "Use block anchors like `^fx2d`",
            detail:
              "Always links to the right place. A short text is inserted into the file.",
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
        return "line";
      }
      anchorType = preference.label;
    }
    return anchorType;
  }

  private async createNonNoteFileLink(editor: TextEditor) {
    const ws = this.extension.getDWorkspace();
    const { wsRoot } = ws;
    const vaults = await ws.vaults;
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
      const foundAnchor = EditorUtils.getBlockAnchorAt({
        editor,
        position: editor.selection.start,
      });
      if (foundAnchor !== undefined) {
        anchor = `#${foundAnchor}`;
      } else {
        // Otherwise, we need to create the correct link based on user preference.
        const anchorType = await this.getUserLinkAnchorPreference();
        if (anchorType === "line") {
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
    return { link: `[[${fsPath}${anchor}]]`, anchor };
  }

  private async createNoteLink(editor: TextEditor, note: NotePropsMeta) {
    const engine = this.extension.getEngine();
    const { selection } = VSCodeUtils.getSelection();
    const { startAnchor: anchor } = await EditorUtils.getSelectionAnchors({
      editor,
      selection,
      engine,
      doEndAnchor: false,
    });

    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(engine.wsRoot)
    );
    if (configReadResult.isErr()) {
      window.showErrorMessage(configReadResult.error.message);
      return;
    }
    const config = configReadResult.value;

    const aliasMode = ConfigUtils.getAliasMode(config);

    return {
      link: NoteUtils.createWikiLink({
        note,
        anchor: _.isUndefined(anchor)
          ? undefined
          : {
              value: anchor,
              type: isBlockAnchor(anchor) ? "blockAnchor" : "header",
            },
        useVaultPrefix: await DendronClientUtilsV2.shouldUseVaultPrefix(engine),
        alias: { mode: aliasMode },
      }),
      anchor,
    };
  }

  addAnalyticsPayload(_opts: CommandOpts, resp: CommandOutput) {
    return { type: resp?.type, anchorType: resp?.anchorType };
  }

  private anchorType(anchor?: string) {
    if (!anchor) return undefined;
    if (isBlockAnchor(anchor)) return "block";
    if (isLineAnchor(anchor)) return "line";
    else return "header";
  }

  async execute(_opts: CommandOpts) {
    const editor = VSCodeUtils.getActiveTextEditor()!;
    const fname = NoteUtils.uri2Fname(editor.document.uri);
    const engine = this.extension.getEngine();
    const vault = await PickerUtilsV2.getVaultForOpenEditor();

    if (editor.document.isDirty) {
      this._onEngineNoteStateChangedDisposable = this.extension
        .getEngine()
        .engineEventEmitter.onEngineNoteStateChanged(
          async (noteChangeEntries: NoteChangeEntry[]) => {
            const savedNote = noteChangeEntries.filter(
              (entry) => entry.note.fname === fname && entry.status === "update"
            );
            // Received event from engine about successful save
            if (savedNote.length > 0) {
              await this.executeCopyNoteLink(savedNote[0].note, editor);
              this.dispose();
            }
          }
        );
      await editor.document.save();
      // Dispose of listener after 1 sec (if not already disposed) in case engine events never arrive
      setTimeout(() => {
        this.dispose();
      }, 1000);
      return;
    } else if (this._onEngineNoteStateChangedDisposable) {
      // If this is not disposed, it means we are still listening on engine state change from previous CopyNoteLink.execute command
      // Do nothing as engine may still not be up-to-date
      return;
    } else {
      const note: NotePropsMeta | undefined = (
        await engine.findNotesMeta({ fname, vault })
      )[0];
      return this.executeCopyNoteLink(note, editor);
    }
  }

  dispose(): void {
    if (this._onEngineNoteStateChangedDisposable) {
      this._onEngineNoteStateChangedDisposable.dispose();
      this._onEngineNoteStateChangedDisposable = undefined;
    }
  }

  private async executeCopyNoteLink(
    note: NotePropsMeta | undefined,
    editor: TextEditor
  ) {
    let link: string;
    let type;
    let anchor;
    if (note) {
      const out = await this.createNoteLink(editor, note);
      if (out === undefined) return;
      link = out.link;
      anchor = out.anchor;
      type = "note";
    } else {
      const out = await this.createNonNoteFileLink(editor);
      link = out.link;
      anchor = out.anchor;
      type = "non-note";
    }

    try {
      clipboard.writeText(link);
    } catch (err) {
      this.L.error({ err, link });
      throw err;
    }
    this.showFeedback(link);
    return { link, type, anchorType: this.anchorType(anchor) };
  }
}
