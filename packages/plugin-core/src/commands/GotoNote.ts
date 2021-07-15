import {
  assertUnreachable,
  DNoteAnchor,
  DVault,
  getSlugger,
  isNotUndefined,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { matchWikiLink, HASHTAG_REGEX_LOOSE } from "@dendronhq/engine-server";
import _ from "lodash";
import {
  TextEditor,
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
                value: `tags.${hashtag[1]}`,
              };
            }
          }
        }
      }
    }
    return;
  }
  /**
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
    let qs: string;
    let vault: DVault =
      opts.vault || PickerUtilsV2.getOrPromptVaultForOpenEditor();
    const client = DendronWorkspace.instance().getEngine();

    if (!opts.qs) {
      const maybeLink = this.getLinkFromSelection();
      if (!maybeLink) {
        window.showErrorMessage("selection is not a valid link");
        return;
      }
      if (maybeLink.value) {
        // Reference to another file
        qs = maybeLink.value as string;
      } else {
        // Same-file block reference, implicitly current file
        const editor = VSCodeUtils.getActiveTextEditor() as TextEditor;
        qs = NoteUtils.uri2Fname(editor.document.uri);
      }
      const vaults = getWS().vaultsv4;
      if (maybeLink.vaultName) {
        vault = VaultUtils.getVaultByNameOrThrow({
          vaults,
          vname: maybeLink.vaultName,
        });
      }
      if (maybeLink.anchorHeader)
        opts.anchor = parseAnchor(maybeLink.anchorHeader);
      // check if note exist in a different vault
      const notes = NoteUtils.getNotesByFname({
        fname: qs,
        notes: client.notes,
      });
      if (notes.length === 1) {
        vault = notes[0].vault;
      } else if (notes.length > 1) {
        // prompt for vault
        const resp = await PickerUtilsV2.promptVault(
          notes.map((ent) => ent.vault)
        );
        if (_.isUndefined(resp)) {
          return;
        }
        vault = resp;
      }
    } else {
      qs = opts.qs;
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
        const editor = await VSCodeUtils.openFileInEditor(uri, {
          column: opts.column,
        });
        this.L.info({ ctx, opts, msg: "exit" });
        if (opts.anchor && editor) {
          const pos = findAnchorPos({ anchor: opts.anchor, note });
          editor.selection = new Selection(pos, pos);
          editor.revealRange(editor.selection);
        }
        return { note, pos };
      }
    );
    return out;
  }
}
