import { IDendronExtension } from "./dendronExtensionInterface";
import vscode from "vscode";
import path from "path";
import {
  DVault,
  NoteProps,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import { IWSUtilsV2 } from "./WSUtilsV2Interface";
import { Logger } from "./logger";
import { VSCodeUtils } from "./vsCodeUtils";

/**
 *  Non static WSUtils to allow unwinding of our circular dependencies.
 *   */
export class WSUtilsV2 implements IWSUtilsV2 {
  private extension: IDendronExtension;

  constructor(extension: IDendronExtension) {
    this.extension = extension;
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
}
