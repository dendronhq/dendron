import {
  assertUnreachable,
  DendronError,
  DNodeUtils,
  EngagementEvents,
  extractNoteChangeEntryCounts,
  NoteChangeEntry,
  NoteProps,
  VaultUtils,
} from "@dendronhq/common-all";
import { DLogger, vault2Path } from "@dendronhq/common-server";
import { Logger } from "../logger";
import _ from "lodash";
import vscode from "vscode";
import { RenameNoteV2aCommand } from "../commands/RenameNoteV2a";
import { ExtensionProvider } from "../ExtensionProvider";
import { AnalyticsUtils } from "../utils/analytics";
import {
  getReferenceAtPosition,
  getReferenceAtPositionResp,
} from "../utils/md";
import { VSCodeUtils } from "../vsCodeUtils";
import { WSUtils } from "../WSUtils";

export default class RenameProvider implements vscode.RenameProvider {
  private _targetNote: NoteProps | undefined;
  private refAtPos: getReferenceAtPositionResp | undefined;
  public L: DLogger = Logger;

  set targetNote(value: NoteProps) {
    this._targetNote = value;
  }

  private async getRangeForReference(opts: {
    reference: getReferenceAtPositionResp;
    document: vscode.TextDocument;
  }) {
    const { reference, document } = opts;
    const engine = ExtensionProvider.getEngine();
    const { vaults } = engine;
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
      const targetNote = (
        await engine.findNotes({ fname, vault: targetVault })
      )[0];
      if (targetNote === undefined) {
        throw new DendronError({
          message: `Cannot rename note ${ref} that doesn't exist.`,
        });
      }
      this._targetNote = targetNote;
      const currentNote = await WSUtils.getNoteFromDocument(document);
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

  trackProxyMetrics({
    note,
    noteChangeEntryCounts,
  }: {
    note: NoteProps;
    noteChangeEntryCounts: {
      createdCount?: number;
      deletedCount?: number;
      updatedCount?: number;
    };
  }) {
    const extension = ExtensionProvider.getExtension();
    const engine = extension.getEngine();
    const { vaults } = engine;

    AnalyticsUtils.track(EngagementEvents.RefactoringCommandUsed, {
      command: "RenameProvider",
      ...noteChangeEntryCounts,
      numVaults: vaults.length,
      traits: note.traits ?? [],
      numChildren: note.children.length,
      numLinks: note.links.length,
      numChars: note.body.length,
      noteDepth: DNodeUtils.getDepth(note),
    });
  }

  public async executeRename(opts: { newName: string }): Promise<
    | {
        changed: NoteChangeEntry[];
      }
    | undefined
  > {
    const { newName } = opts;
    if (this._targetNote !== undefined) {
      const engine = ExtensionProvider.getEngine();
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

      const noteChangeEntryCounts = extractNoteChangeEntryCounts(resp.changed);
      try {
        this.trackProxyMetrics({
          note: this._targetNote,
          noteChangeEntryCounts,
        });
      } catch (error) {
        this.L.error({ error });
      }

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
    if (
      !(await ExtensionProvider.isActiveAndIsDendronNote(document.uri.fsPath))
    ) {
      throw new DendronError({
        message: "Rename is not supported for non dendron notes",
      });
    }
    const { wsRoot, vaults } = ExtensionProvider.getDWorkspace();

    const reference = await getReferenceAtPosition({
      document,
      position,
      wsRoot,
      vaults,
    });
    if (reference !== null) {
      this.refAtPos = reference;
      return this.getRangeForReference({ reference, document });
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
