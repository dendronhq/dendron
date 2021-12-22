import {
  assertUnreachable,
  DNoteAnchorBasic,
  DVault,
  getSlugger,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { findNonNoteFile } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { Position, Selection, Uri, ViewColumn, window } from "vscode";
import { VaultSelectionMode } from "../components/lookup/types";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { getAnalyticsPayload } from "../utils/analytics";
import { getReferenceAtPosition } from "../utils/md";
import { VSCodeUtils } from "../vsCodeUtils";
import { getDWorkspace, getExtension } from "../workspace";
import { WSUtils } from "../WSUtils";
import { BasicCommand } from "./base";

type CommandOpts = {
  qs?: string;
  vault?: DVault;
  anchor?: DNoteAnchorBasic;
  overrides?: Partial<NoteProps>;
  kind?: TargetKind;
  /**
   * What {@link vscode.ViewColumn} to open note in
   */
  column?: ViewColumn;
  /** added for contextual UI analytics. */
  source?: string;
};
export { CommandOpts as GotoNoteCommandOpts };

export enum TargetKind {
  NOTE = "note",
  NON_NOTE = "nonNote",
}

type CommandOutput =
  // When opening a note
  | { kind: TargetKind.NOTE; note: NoteProps; pos?: Position; source?: string }
  // When opening a non-note file
  | { kind: TargetKind.NON_NOTE; fullPath: string }
  | undefined;

export const findAnchorPos = (opts: {
  anchor: DNoteAnchorBasic;
  note: NoteProps;
}): Position => {
  const { anchor: findAnchor, note } = opts;
  let key: string;
  switch (findAnchor.type) {
    case "line":
      return new Position(findAnchor.line - 1, 0);
    case "block":
      key = `^${findAnchor.value}`;
      break;
    case "header":
      key = getSlugger().slug(findAnchor.value);
      break;
    default:
      assertUnreachable(findAnchor);
  }

  const found = note.anchors[key];

  if (_.isUndefined(found)) return new Position(0, 0);
  return new Position(found.line, found.column);
};

type FoundLinkSelection = NonNullable<
  ReturnType<GotoNoteCommand["getLinkFromSelection"]>
>;

/**
 * Open or create a note. See {@link GotoNoteCommand.execute} for details
 */
export class GotoNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.GOTO_NOTE.key;

  getLinkFromSelection() {
    const { selection, editor } = VSCodeUtils.getSelection();
    if (
      _.isEmpty(selection) ||
      _.isUndefined(selection) ||
      _.isUndefined(selection.start)
    )
      return;
    const currentLine = editor?.document.lineAt(selection.start.line).text;
    if (!currentLine) return;
    const reference = getReferenceAtPosition(
      editor!.document,
      selection.start,
      { allowInCodeBlocks: true }
    );
    if (!reference) return;
    return {
      alias: reference?.label,
      value: reference?.ref,
      vaultName: reference?.vaultName,
      anchorHeader: reference.anchorStart,
    };
  }

  private getQs(opts: CommandOpts, link: FoundLinkSelection): CommandOpts {
    if (link.value) {
      // Reference to another file
      opts.qs = link.value;
    } else {
      // Same file block reference, implicitly current file
      const note = WSUtils.getActiveNote();
      if (note) {
        // Same file link within note
        opts.qs = note.fname;
        opts.vault = note.vault;
      } else {
        const { wsRoot, vaults } = getDWorkspace().engine;
        // Same file link within non-note file
        opts.qs = path.relative(
          wsRoot,
          VSCodeUtils.getActiveTextEditorOrThrow().document.fileName
        );
        opts.vault = VaultUtils.getVaultByFilePath({
          wsRoot,
          vaults,
          fsPath: opts.qs,
        });
      }
    }
    return opts;
  }

  private async maybeSetOptsFromExistingNote(opts: CommandOpts) {
    const { engine } = getDWorkspace();
    const notes = NoteUtils.getNotesByFname({
      fname: opts.qs!,
      notes: engine.notes,
    });
    if (notes.length === 1) {
      // There's just one note, so that's the one we'll go with.
      opts.vault = notes[0].vault;
    } else if (notes.length > 1) {
      // It's ambiguous which note the user wants to go to, so we have to
      // guess or prompt.
      const resp = await PickerUtilsV2.promptVault(
        notes.map((ent) => ent.vault)
      );
      if (_.isUndefined(resp)) return null;
      opts.vault = resp;
    }
    // Not an existing note
    return opts;
  }

  private async maybeSetOptsFromNonNote(opts: CommandOpts) {
    const { vaults, wsRoot } = getDWorkspace().engine;
    const nonNote = await findNonNoteFile({
      fpath: opts.qs!,
      wsRoot,
      vaults,
    });
    if (nonNote) {
      opts.qs = nonNote.fullPath;
      opts.kind = TargetKind.NON_NOTE;
    }
    return opts;
  }

  private async setOptsFromNewNote(opts: CommandOpts) {
    // Depending on the config, we can either
    // automatically pick the vault or we'll prompt for it.
    const confirmVaultSetting =
      getDWorkspace().config["lookupConfirmVaultOnCreate"];
    const selectionMode =
      confirmVaultSetting !== true
        ? VaultSelectionMode.smart
        : VaultSelectionMode.alwaysPrompt;

    const currentVault = PickerUtilsV2.getVaultForOpenEditor();
    const selectedVault = await PickerUtilsV2.getOrPromptVaultForNewNote({
      vault: currentVault,
      fname: opts.qs!,
      vaultSelectionMode: selectionMode,
    });

    // If we prompted the user and they selected nothing, then they want to cancel
    if (_.isUndefined(selectedVault)) {
      return null;
    }
    opts.vault = selectedVault;
    return opts;
  }

  private async processInputs(opts: CommandOpts) {
    if (opts.qs && opts.vault) return opts;

    if (opts.qs && !opts.vault) {
      // Special case: some code expects GotoNote to default to current vault if qs is provided but vault isn't
      opts.vault = PickerUtilsV2.getVaultForOpenEditor();
      return opts;
    }

    const link = this.getLinkFromSelection();
    if (!link) {
      window.showErrorMessage("selection is not a valid link");
      return null;
    }

    // Get missing opts from the selected link, if possible
    if (!opts.qs) opts = this.getQs(opts, link);
    if (!opts.vault && link.vaultName)
      opts.vault = VaultUtils.getVaultByNameOrThrow({
        vaults: getDWorkspace().vaults,
        vname: link.vaultName,
      });
    if (!opts.anchor && link.anchorHeader) opts.anchor = link.anchorHeader;

    // If vault is missing, then we haven't found the note yet. Go through possible options until we find it.
    if (opts.vault === undefined) {
      const existingNote = await this.maybeSetOptsFromExistingNote(opts);
      // User cancelled prompt
      if (existingNote === null) return null;
      opts = existingNote;
    }
    if (opts.vault === undefined) {
      opts = await this.maybeSetOptsFromNonNote(opts);
    }
    // vault undefined and we're not targeting a {@link TargetKind.NON_NOTE}
    if (opts.vault === undefined && opts.kind !== TargetKind.NON_NOTE) {
      const newNote = await this.setOptsFromNewNote(opts);
      // User cancelled prompt
      if (newNote === null) return null;
      opts = newNote;
    }

    return opts;
  }

  /**
   *
   * Warning about `opts`! If `opts.qs` is provided but `opts.vault` is empty,
   * it will default to the current vault. If `opts.qs` is not provided, it will
   * read the selection from the current document as a link to get it. If both
   * `opts.qs` and `opts.vault` is empty, both will be read from the selected link.
   *
   * @param opts.qs - query string. should correspond to {@link NoteProps.fname}
   * @param opts.vault - {@link DVault} for note
   * @param opts.anchor - a {@link DNoteAnchor} to navigate to
   * @returns
   */
  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const ctx = "GotoNoteCommand";
    this.L.info({ ctx, opts, msg: "enter" });
    const { overrides } = opts;
    const client = getExtension().getEngine();
    const { wsRoot } = getDWorkspace();

    const processedOpts = await this.processInputs(opts);
    if (processedOpts === null) return; // User cancelled a prompt, or did not have a valid link selected
    const { qs, vault } = processedOpts;

    // Non-note files use `qs` for full path, and set vault to null
    if (opts.kind === TargetKind.NON_NOTE && qs) {
      const editor = await VSCodeUtils.openFileInEditor(
        Uri.from({ scheme: "file", path: qs }),
        {
          column: opts.column,
        }
      );
      if (opts.anchor?.type === "line" && editor) {
        // non-note files only support line based references right now
        const position = new Position(
          opts.anchor.line - 1 /* line anchors are 1-indexed */,
          0
        );
        editor.selection = new Selection(position, position);
        editor.revealRange(editor.selection);
      }
      return {
        kind: TargetKind.NON_NOTE,
        fullPath: qs,
      };
    }

    if (qs === undefined || vault === undefined) {
      // There was an error or the user cancelled a prompt
      return;
    }

    // Otherwise, it's a regular note
    let pos: undefined | Position;
    const out = await getExtension().pauseWatchers<CommandOutput>(async () => {
      const { data } = await client.getNoteByPath({
        npath: qs,
        createIfNew: true,
        vault,
        overrides,
      });
      const note = data?.note as NoteProps;
      const npath = NoteUtils.getFullPath({
        note,
        wsRoot,
      });
      const uri = Uri.file(npath);
      const editor = await VSCodeUtils.openFileInEditor(uri, {
        column: opts.column,
      });
      this.L.info({ ctx, opts, msg: "exit" });
      if (opts.anchor && editor) {
        pos = findAnchorPos({ anchor: opts.anchor, note });
        editor.selection = new Selection(pos, pos);
        editor.revealRange(editor.selection);
      }
      return { kind: TargetKind.NOTE, note, pos, source: opts.source };
    });
    return out;
  }

  addAnalyticsPayload(opts?: CommandOpts, resp?: CommandOutput) {
    const { source } = { ...opts, ...resp };
    return getAnalyticsPayload(source);
  }
}
