import {
  assertUnreachable,
  DNoteAnchor,
  DVault,
  getSlugger,
  isNotUndefined,
  NoteProps,
  NoteUtils,
  TAGS_HIERARCHY,
  VaultUtils,
} from "@dendronhq/common-all";
import { matchWikiLink, HASHTAG_REGEX_LOOSE } from "@dendronhq/engine-server";
import _ from "lodash";
import {
  Position,
  Selection,
  Uri,
  window,
  ViewColumn,
} from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { VSCodeUtils } from "../utils";
import { parseAnchor } from "../utils/md";
import { DendronWorkspace, getWS } from "../workspace";
import { BasicCommand } from "./base";
import { VaultSelectionMode } from "./LookupCommand";

type CommandOpts = {
  qs?: string;
  vault?: DVault;
  anchor?: DNoteAnchor;
  overrides?: Partial<NoteProps>;
  /**
   * What {@link vscode.ViewColumn} to open note in
   */
  column?: ViewColumn;
};
export { CommandOpts as GotoNoteCommandOpts };

type CommandOutput = { note: NoteProps; pos?: Position } | undefined;

export const findAnchorPos = (opts: {
  anchor: DNoteAnchor;
  note: NoteProps;
}): Position => {
  const { anchor: findAnchor, note } = opts;
  let key: string;
  if (findAnchor.type === "header") key = getSlugger().slug(findAnchor.value);
  else if (findAnchor.type === "block") key = `^${findAnchor.value}`;
  else assertUnreachable(findAnchor.type);

  const found = note.anchors[key];

  if (_.isUndefined(found)) return new Position(0, 0);
  return new Position(found.line, found.column);
};

/**
 * Open or create a note. See {@link GotoNoteCommand.execute} for details
 */
export class GotoNoteCommand extends BasicCommand<CommandOpts, CommandOutput> {
  key = DENDRON_COMMANDS.GOTO_NOTE.key;

  getLinkFromSelection() {
    const { selection, editor } = VSCodeUtils.getSelection();
    if (!_.isEmpty(selection) && selection?.start) {
      const currentLine = editor?.document.lineAt(selection.start.line).text;

      if (currentLine) {
        const lastIdx = currentLine
          .slice(0, selection.start.character)
          .lastIndexOf("[[");
        const padding = Math.max(lastIdx - 3, 0);
        const txtToMatch = currentLine.slice(padding);
        const out = matchWikiLink(txtToMatch);
        if (
          out &&
          _.inRange(
            selection.start.character,
            out.start + padding,
            out.end + padding
          )
        ) {
          return out.link;
        } else {
          // handle hashtags
          for (const hashtag of currentLine.matchAll(new RegExp(HASHTAG_REGEX_LOOSE, "g"))) {
            if (isNotUndefined(hashtag.index) && _.inRange(selection.start.character, hashtag.index, hashtag.index + hashtag[0].length)) {
              return {
                alias: hashtag[0],
                value: `${TAGS_HIERARCHY}${hashtag.groups!.tagContents}`,
              };
            }
          }
        }
      }
    }
    return;
  }

  private async processInputs(opts: CommandOpts) {
    if (opts.qs && opts.vault) return opts;
    const engine = DendronWorkspace.instance().getEngine();

    if (opts.qs && !opts.vault) {
      // Special case: some code expects GotoNote to default to current vault if qs is provided but vault isn't
      opts.vault = PickerUtilsV2.getVaultForOpenEditor();
      return opts;
    }

    const link = this.getLinkFromSelection();
    if (!link) {
      window.showErrorMessage("selection is not a valid link");
      return;
    }

    // no fname provided, get it from selected link
    if (!opts.qs) {
      if (link.value) {
        // Reference to another file
        opts.qs = link.value;
      } else {
        // Same-file block reference, implicitly current file
        const editor = VSCodeUtils.getActiveTextEditorOrThrow();
        opts.qs = NoteUtils.uri2Fname(editor.document.uri);
      }
    }

    if (!opts.anchor && link.anchorHeader) opts.anchor = parseAnchor(link.anchorHeader);

    if (!opts.vault) {
      if (link.vaultName) {
        // if vault is defined on the link, then it's always that one
        opts.vault = VaultUtils.getVaultByNameOrThrow({
          vaults: getWS().vaultsv4,
          vname: link.vaultName,
        });
      } else {
        // Otherwise, we need to guess or prompt the vault. If linked note
        // exists in some vault, we might be able to use that.
        const notes = NoteUtils.getNotesByFname({
          fname: opts.qs,
          vault: opts.vault,
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
          if (_.isUndefined(resp)) return;
          opts.vault = resp;
        } else {
          // This is a new note. Depending on the config, we can either
          // automatically pick the vault or we'll prompt for it.
          const confirmVaultSetting =
            DendronWorkspace.instance().config["lookupConfirmVaultOnCreate"];
          const selectionMode =
            confirmVaultSetting !== true
              ? VaultSelectionMode.smart
              : VaultSelectionMode.alwaysPrompt;
  
          const currentVault = PickerUtilsV2.getVaultForOpenEditor();
          const selectedVault = await PickerUtilsV2.getOrPromptVaultForNewNote({
            vault: currentVault,
            fname: opts.qs,
            vaultSelectionMode: selectionMode,
          });
  
          // If we prompted the user and they selected nothing, then they want to cancel
          if (_.isUndefined(selectedVault)) {
            return;
          }
          opts.vault = selectedVault;
        }
      }
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
    const client = DendronWorkspace.instance().getEngine();

    const { qs, vault } = await this.processInputs(opts) || opts;
    if (_.isUndefined(qs) || _.isUndefined(vault)) {
      // There was an error or the user cancelled a prompt
      return;
    }
    
    let pos: undefined | Position;
    const out = await DendronWorkspace.instance().pauseWatchers<CommandOutput>(
      async () => {
        const { data } = await client.getNoteByPath({
          npath: qs,
          createIfNew: true,
          vault,
          overrides,
        });
        const note = data?.note as NoteProps;
        const npath = NoteUtils.getFullPath({
          note,
          wsRoot: DendronWorkspace.wsRoot(),
        });
        const uri = Uri.file(npath);
        if (opts.anchor) {
          // We're going to move somewhere, so don't auto-move past frontmatter
          getWS().windowWatcher?.dontMoveCursorOnFirstOpen(uri.fsPath);
        }
        const editor = await VSCodeUtils.openFileInEditor(uri, {
          column: opts.column,
        });
        this.L.info({ ctx, opts, msg: "exit" });
        if (opts.anchor && editor) {
          pos = findAnchorPos({ anchor: opts.anchor, note });
          editor.selection = new Selection(pos, pos);
          editor.revealRange(editor.selection);
        }
        return { note, pos };
      }
    );
    return out;
  }
}
