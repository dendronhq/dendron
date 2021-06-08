import _ from "lodash";
import { ERROR_SEVERITY, genUUID, NoteUtils } from "@dendronhq/common-all";
import { DendronError } from "@dendronhq/common-all";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { BasicCommand } from "./base";
import { clipboard, DendronClientUtilsV2, VSCodeUtils } from "../utils";
import { window, Position, TextEditor, TextEditorEdit } from "vscode";
import { getEngine } from "../workspace";
const L = Logger;

type CommandOpts = {};
type CommandReturns = string;

export class CopyBlockReferenceCommand extends BasicCommand<
  CommandOpts,
  CommandReturns
> {
  static key = DENDRON_COMMANDS.COPY_BLOCK_REFERENCE.key;

  static addAnchorAt({
    editBuilder,
    editor,
    position,
    anchor,
  }: {
    editBuilder: TextEditorEdit;
    editor: TextEditor;
    position: Position;
    anchor?: string;
  }) {
    if (_.isUndefined(anchor)) anchor = genUUID().slice(0, 8);
    const line = editor.document.lineAt(position.line);
    editBuilder.insert(line.range.end, ` ^${anchor}`);
    return `^${anchor}`;
  }

  async execute(opts?: CommandOpts) {
    const ctx = "execute";
    L.info({ ctx, opts });

    const { text, selection, editor } = VSCodeUtils.getSelection();
    // should never happen because the command's `when` is if there's a selection
    if (
      _.isUndefined(text) ||
      _.isUndefined(selection) ||
      _.isUndefined(editor)
    )
      throw new DendronError({
        message: "No block selected to reference",
        severity: ERROR_SEVERITY.FATAL,
      });

    const anchorsInserted: string[] = [];

    // insert the anchors into this note
    editor.edit((editBuilder) => {
      const anchor = CopyBlockReferenceCommand.addAnchorAt({
        editBuilder,
        editor,
        position: selection.start,
      });
      anchorsInserted.push(anchor);
      if (!selection.isSingleLine) {
        // if the selection spans multiple lines, add start and end anchors
        const anchor = CopyBlockReferenceCommand.addAnchorAt({
          editBuilder,
          editor,
          position: selection.end,
        });
        anchorsInserted.push(anchor);
      }
    });

    const note = VSCodeUtils.getNoteFromDocument(editor.document);
    // Probably should never happen. Maybe if the note was created but not yet saved?
    if (_.isUndefined(note))
      throw new DendronError({
        message:
          'Can\'t find the open note! Try saving this file and running "Dendron: Reload Index"',
      });

    // build the link and put it in the clipboard
    const link = NoteUtils.createWikiLink({
      note,
      header: anchorsInserted.join("#:"), // note#^anchor or note#^start:#^end, the first # is automatically inserted in createWikiLink
      headerRaw: true, // don't transform the header, use as-is
      useVaultPrefix: DendronClientUtilsV2.useVaultPrefix(getEngine()),
    });

    try {
      clipboard.writeText(link);
    } catch (err) {
      this.L.error({ err, link });
      throw err;
    }

    window.showInformationMessage(`${link} copied`);
    return link;
  }
}
