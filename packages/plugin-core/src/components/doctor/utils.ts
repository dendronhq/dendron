import {
  DendronError,
  DuplicateNoteError,
  ErrorUtils,
  NoteUtils,
  VaultUtils,
  WorkspaceEvents,
} from "@dendronhq/common-all";
import { file2Note } from "@dendronhq/common-server";
import { DoctorActionsEnum } from "@dendronhq/engine-server";
import path from "path";
import * as vscode from "vscode";
import { DoctorCommand } from "../../commands/Doctor";
import { ExtensionProvider } from "../../ExtensionProvider";
import { Logger } from "../../logger";
import { AnalyticsUtils } from "../../utils/analytics";
import { MessageSeverity, VSCodeUtils } from "../../vsCodeUtils";

export class DoctorUtils {
  static async findDuplicateNoteFromDocument(document: vscode.TextDocument) {
    const ctx = "findDuplicateNoteFromDocument";
    const fsPath = document.uri.fsPath;
    // return if file is not a markdown
    if (!fsPath.endsWith(".md")) return;
    // return if file is in source control view
    if (document.uri.scheme === "git") return;

    const extension = ExtensionProvider.getExtension();
    const ws = extension.getDWorkspace();
    const { wsRoot, engine } = ws;
    const vaults = await ws.vaults;
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
    const resp = file2Note(fsPath, vault);
    if (ErrorUtils.isErrorResp(resp)) {
      // not in file system, we do nothing.
      Logger.error({ ctx, error: resp.error });
      return;
    }
    const currentNote = resp.data;

    // find the potentially-duplicate note that's currently in our store.
    const noteById = (await engine.getNote(currentNote.id)).data;

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
        VSCodeUtils.showMessage(
          MessageSeverity.WARN,
          error.message,
          {},
          { title: "Fix It" }
        ).then((resp) => {
          if (resp && resp.title === "Fix It") {
            const cmd: vscode.Command = {
              command: new DoctorCommand(ExtensionProvider.getExtension()).key,
              title: "Fix the frontmatter",
              arguments: [
                {
                  scope: "file",
                  action: DoctorActionsEnum.REGENERATE_NOTE_ID,
                  data: { note: duplicate },
                },
              ],
            };
            AnalyticsUtils.track(WorkspaceEvents.DuplicateNoteFound, {
              state: "resolved",
            });
            vscode.commands.executeCommand(cmd.command, ...cmd.arguments!);
          }
        });
        AnalyticsUtils.track(WorkspaceEvents.DuplicateNoteFound, {
          source,
        });
      }
    }
  }

  static async validateFilenameFromDocumentAndPromptIfNecessary(
    document: vscode.TextDocument
  ) {
    const extension = ExtensionProvider.getExtension();
    const wsUtils = extension.wsUtils;
    const filename = path.basename(document.fileName, ".md");
    const note = await wsUtils.getNoteFromDocument(document);

    if (!note) return true;

    const result = NoteUtils.validateFname(filename);

    if (result.isValid) return true;

    const error = new DendronError({
      message:
        "This note has an invalid filename. Please click the button below to fix it.",
    });
    VSCodeUtils.showMessage(
      MessageSeverity.WARN,
      error.message,
      {},
      { title: "Fix Invalid Filenames" }
    ).then(async (resp) => {
      if (resp && resp.title === "Fix Invalid Filenames") {
        const cmd: vscode.Command = {
          command: new DoctorCommand(ExtensionProvider.getExtension()).key,
          title: "Fix Invalid Filenames",
          arguments: [
            {
              scope: "file",
              action: DoctorActionsEnum.FIX_INVALID_FILENAMES,
              data: { note },
            },
          ],
        };
        vscode.commands.executeCommand(cmd.command, ...cmd.arguments!);
      }
    });

    return false;
  }
}
