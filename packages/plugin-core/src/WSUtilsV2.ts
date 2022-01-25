import { IDendronExtension } from "./dendronExtensionInterface";
import vscode from "vscode";
import path from "path";
import {
  DVault,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { IWSUtilsV2 } from "./WSUtilsV2Interface";
import { VaultPickerItem } from "./components/lookup/utils";
import { Logger } from "./logger";
import { VSCodeUtils } from "./vsCodeUtils";
import { ExtensionProvider } from "./ExtensionProvider";
import { isInsidePath } from "@dendronhq/common-server";

let WS_UTILS: IWSUtilsV2 | undefined;

/**
 *  Non static WSUtils to allow unwinding of our circular dependencies.
 *   */
export class WSUtilsV2 implements IWSUtilsV2 {
  private extension: IDendronExtension;

  constructor(extension: IDendronExtension) {
    this.extension = extension;
  }

  /**
   * Prefer NOT to use this method and instead get WSUtilsV2 passed in as
   * dependency or use IDendronExtension.wsUtils.
   *
   * This method exists to satisfy static method of WSUtils while refactoring
   * is happening and we are moving method to this class.
   * */
  static instance() {
    if (WS_UTILS === undefined) {
      WS_UTILS = new WSUtilsV2(ExtensionProvider.getExtension());
    }
    return WS_UTILS;
  }

  getVaultFromUri(fileUri: vscode.Uri): DVault {
    const { vaults } = this.extension.getDWorkspace();
    const vault = VaultUtils.getVaultByFilePath({
      fsPath: fileUri.fsPath,
      vaults,
      wsRoot: this.extension.getDWorkspace().wsRoot,
    });
    return vault;
  }

  getNoteFromDocument(document: vscode.TextDocument) {
    const { engine, wsRoot } = this.extension.getDWorkspace();
    const txtPath = document.uri.fsPath;
    const fname = path.basename(txtPath, ".md");
    let vault: DVault;
    try {
      vault = this.getVaultFromDocument(document);
    } catch (err) {
      // No vault
      return undefined;
    }
    return NoteUtils.getNoteByFnameV5({
      fname,
      vault,
      wsRoot,
      notes: engine.notes,
    });
  }

  /**
   * See {@link IWSUtilsV2.getNoteFromMultiVault}
   */
  async getNoteFromMultiVault(opts: { fname: string; vault?: DVault }) {
    const { fname, vault } = opts;
    let existingNote: NoteProps | undefined;
    const engine = ExtensionProvider.getEngine();
    const maybeNotes = NoteUtils.getNotesByFnameFromEngine({
      fname,
      engine,
      vault,
    });

    if (maybeNotes.length === 1) {
      // Only one match so use that as note
      existingNote = maybeNotes[0];
    } else if (maybeNotes.length > 1) {
      // If there are multiple notes with this fname, prompt user to select which vault
      const vaults: VaultPickerItem[] = maybeNotes.map((noteProps) => {
        return {
          vault: noteProps.vault,
          label: VaultUtils.getName(noteProps.vault),
        };
      });

      const items = vaults.map((vaultPickerItem) => ({
        ...vaultPickerItem,
        label: vaultPickerItem.label
          ? vaultPickerItem.label
          : vaultPickerItem.vault.fsPath,
      }));
      const resp = await vscode.window.showQuickPick(items, {
        title: "Select Vault",
      });

      if (!_.isUndefined(resp)) {
        existingNote = _.find(maybeNotes, { vault: resp.vault });
      }
    } // Else no match in which case we return undefined
    return existingNote;
  }

  getVaultFromDocument(document: vscode.TextDocument) {
    const txtPath = document.uri.fsPath;
    const { wsRoot, vaults } = this.extension.getDWorkspace();
    const vault = VaultUtils.getVaultByFilePath({
      wsRoot,
      vaults,
      fsPath: txtPath,
    });
    return vault;
  }

  tryGetNoteFromDocument(document: vscode.TextDocument): NoteProps | undefined {
    if (
      !this.extension.workspaceService?.isPathInWorkspace(document.uri.fsPath)
    ) {
      Logger.info({
        uri: document.uri.fsPath,
        msg: "not in workspace",
      });
      return;
    }
    try {
      const note = this.getNoteFromDocument(document);
      return note;
    } catch (err) {
      Logger.info({
        uri: document.uri.fsPath,
        msg: "not a valid note",
      });
    }
    return;
  }

  getActiveNote() {
    const editor = VSCodeUtils.getActiveTextEditor();
    if (editor) return this.getNoteFromDocument(editor.document);
    return;
  }

  /** If the text document at `filePath` is open in any editor, return that document. */
  getMatchingTextDocument(filePath: string): vscode.TextDocument | undefined {
    const { wsRoot } = this.extension.getDWorkspace();
    // Normalize file path for reliable comparison
    if (isInsidePath(wsRoot, filePath)) {
      filePath = path.relative(wsRoot, filePath);
    }
    return vscode.workspace.textDocuments.filter((document) => {
      let documentPath = document.uri.fsPath;
      if (isInsidePath(wsRoot, documentPath)) {
        documentPath = path.relative(wsRoot, documentPath);
      }
      return path.relative(filePath, documentPath) === "";
    })[0];
  }
}
