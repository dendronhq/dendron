import {
  assertUnreachable,
  DendronError,
  NoteChangeEntry,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { vault2Path } from "@dendronhq/common-server";
import vscode from "vscode";
import { RenameNoteV2aCommand } from "../commands/RenameNoteV2a";
import {
  getReferenceAtPosition,
  getReferenceAtPositionResp,
} from "../utils/md";
import { VSCodeUtils } from "../vsCodeUtils";
import { getDWorkspace } from "../workspace";
import { WSUtils } from "../WSUtils";

export default class RenameProvider implements vscode.RenameProvider {
  private _targetNote: NoteProps | undefined;
  private refAtPos: getReferenceAtPositionResp | undefined;

  set targetNote(value: NoteProps) {
    this._targetNote = value;
  }

  private getRangeForReference(opts: {
    reference: getReferenceAtPositionResp;
    document: vscode.TextDocument;
  }) {
    const { reference, document } = opts;
    const { engine } = getDWorkspace();
    const { notes, vaults, wsRoot } = engine;
    const { label, vaultName, range, ref, refType, refText } = reference;
    const targetVault = vaultName
      ? VaultUtils.getVaultByName({ vaults, vname: vaultName })
      : WSUtils.getVaultFromDocument(document);
    if (targetVault === undefined) {
      throw new DendronError({
        message: `Cannot rename note with specified vault (${vaultName}). Vault does not exist.`,
      });
    } else {
      const fname = ref;
      const targetNote = NoteUtils.getNoteByFnameV5({
        fname,
        notes,
        vault: targetVault,
        wsRoot,
      });
      if (targetNote === undefined) {
        throw new DendronError({
          message: `Cannot rename note ${ref} that doesn't exist.`,
        });
      }
      this._targetNote = targetNote;
      const currentNote = WSUtils.getNoteFromDocument(document);
      if (_.isEqual(currentNote, targetNote)) {
        throw new DendronError({
          message: `Cannot rename symbol that references current note.`,
        });
      }
      switch (refType) {
        case "wiki":
        case "refv2": {
          const fullRefText =
            refType === "wiki" ? `[[${refText}]]` : `![[${refText}]]`;
          const anchorLength = refText.length - ref.length;
          const startOffset =
            refType === "wiki"
              ? fullRefText.indexOf(ref)
              : fullRefText.indexOf(ref) - 1;
          const labelOffset = label ? `${label}|`.length : 0;
          const vaultPrefixOffset = vaultName
            ? `dendron://${vaultName}/`.length
            : 0;
          const anchorOffset = anchorLength + 2;
          const start = new vscode.Position(
            range.start.line,
            range.start.character + startOffset
          );
          const end = new vscode.Position(
            range.end.line,
            range.end.character - anchorOffset + vaultPrefixOffset + labelOffset
          );
          return new vscode.Range(start, end);
        }
        case "hashtag":
        case "usertag": {
          const start = new vscode.Position(
            reference.range.start.line,
            reference.range.start.character + 1
          );
          const end = reference.range.end;
          return new vscode.Range(start, end);
        }
        case "fmtag": {
          return reference.range;
        }
        case undefined:
          throw new DendronError({
            message: "Unknown reference type",
            payload: {
              ctx: "RenameProvider.getRangeForReference",
              refType,
            },
          });
        default: {
          assertUnreachable(refType);
        }
      }
    }
    return;
  }

  public async executeRename(opts: { newName: string }): Promise<
    | {
        changed: NoteChangeEntry[];
      }
    | undefined
  > {
    const { newName } = opts;
    if (this._targetNote !== undefined) {
      const { engine } = getDWorkspace();
      const { wsRoot } = engine;
      const renameCmd = new RenameNoteV2aCommand();
      const targetVault = this._targetNote.vault;
      const vpath = vault2Path({ wsRoot, vault: targetVault });
      const rootUri = vscode.Uri.file(vpath);
      const oldUri = VSCodeUtils.joinPath(
        rootUri,
        `${this._targetNote.fname}.md`
      );
      let newNamePrefix = "";
      if (
        this.refAtPos?.refType === "hashtag" ||
        this.refAtPos?.refType === "fmtag"
      ) {
        newNamePrefix = "tags.";
      } else if (this.refAtPos?.refType === "usertag") {
        newNamePrefix = "user.";
      }
      const newUri = VSCodeUtils.joinPath(
        rootUri,
        `${newNamePrefix}${newName}.md`
      );
      const resp = await renameCmd.execute({
        files: [{ oldUri, newUri }],
        silent: false,
        closeCurrentFile: false,
        openNewFile: false,
        noModifyWatcher: true,
      });

      const changed = resp.changed;
      if (changed.length > 0) {
        const createdCount = changed.filter(
          (change) => change.status === "create"
        ).length;
        const updatedCount = changed.filter(
          (change) => change.status === "update"
        ).length;
        const deletedCount = changed.filter(
          (change) => change.status === "delete"
        ).length;
        const msg = `Created ${createdCount}, updated ${updatedCount}, and deleted ${deletedCount} files.`;
        vscode.window.showInformationMessage(msg);
      }
      return resp;
    }
    return;
  }

  public async prepareRename(
    document: vscode.TextDocument,
    position: vscode.Position
  ) {
    const reference = getReferenceAtPosition(document, position);
    if (reference !== null) {
      this.refAtPos = reference;
      const range = this.getRangeForReference({ reference, document });
      return range;
    } else {
      throw new DendronError({
        message: "Rename is not supported for this symbol",
      });
    }
  }

  public async provideRenameEdits(
    _document: vscode.TextDocument,
    _position: vscode.Position,
    newName: string
  ) {
    await this.executeRename({ newName });
    // return a dummy edit.
    return new vscode.WorkspaceEdit();
  }
}
