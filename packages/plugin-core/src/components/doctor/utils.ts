import {
  DuplicateNoteError,
  VaultUtils,
  WorkspaceEvents,
} from "@dendronhq/common-all";
import { file2Note } from "@dendronhq/common-server";
import * as vscode from "vscode";
import { ExtensionProvider } from "../../ExtensionProvider";
import { Logger } from "../../logger";
import { AnalyticsUtils } from "../../utils/analytics";
import { MessageSeverity, VSCodeUtils } from "../../vsCodeUtils";

export class DoctorUtils {
  static async findDuplicateNoteFromDocument(document: vscode.TextDocument) {
    const fsPath = document.uri.fsPath;
    // return if file is not a markdown
    if (!fsPath.endsWith(".md")) return;
    const extension = ExtensionProvider.getExtension();
    const { vaults, wsRoot, engine } = extension.getDWorkspace();
    let vault;
    try {
      vault = VaultUtils.getVaultByFilePath({
        vaults,
        wsRoot,
        fsPath,
      });
    } catch (error: any) {
      // document doesn't exist in workspace.
      return;
    }

    // we do this because the note in document would _not_ be in our store
    // if it is a duplicate note.
    const currentNote = file2Note(fsPath, vault);

    // find the potentially-duplicate note that's currently in our store.
    const noteById = await engine.getNote(currentNote.id);

    let hasDuplicate = false;

    if (noteById !== undefined) {
      if (currentNote.id === noteById.id) {
        // id of note in store and from document is the same. we _might_ have hit a duplicate.
        if (VaultUtils.isEqualV2(currentNote.vault, noteById.vault)) {
          // if they are in the same vault, if their fname is different, they are duplicates.
          // otherwise, the note in our store and the note from document is the same note. not a duplicate.
          hasDuplicate = currentNote.fname !== noteById.fname;
        } else {
          // if they are in different vaults, they are duplicate.
          hasDuplicate = true;
        }
      }

      if (hasDuplicate) {
        Logger.warn({
          uri: document.uri.fsPath,
          msg: "duplicate note id found",
          id: currentNote.id,
        });
      }

      const resp = hasDuplicate
        ? { note: currentNote, duplicate: noteById }
        : { note: currentNote };

      return resp;
    }
    return { note: currentNote };
  }

  static async findDuplicateNoteAndPromptIfNecessary(
    document: vscode.TextDocument,
    source: string
  ): Promise<void> {
    const resp = await DoctorUtils.findDuplicateNoteFromDocument(document);
    if (resp !== undefined) {
      const { note, duplicate } = resp;
      if (duplicate !== undefined) {
        const error = new DuplicateNoteError({
          noteA: duplicate,
          noteB: note,
        });
        VSCodeUtils.showMessage(MessageSeverity.WARN, error.message, {});
        AnalyticsUtils.track(WorkspaceEvents.DuplicateNoteFound, {
          source,
        });
      }
    }
  }
}
