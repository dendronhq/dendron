import os from "os";
import * as vscode from "vscode";
import { GLOBAL_STATE } from "./constants";
import fs from "fs-extra";
import path from "path";
import { FileTestUtils } from "@dendronhq/common-server";

// === File FUtils
export function resolveTilde(filePath: string) {
  if (!filePath || typeof filePath !== "string") {
    return "";
  }
  // '~/folder/path' or '~'
  if (filePath[0] === "~" && (filePath[1] === "/" || filePath.length === 1)) {
    return filePath.replace("~", os.homedir());
  }
  return filePath;
}

export function getPlatform() {
  return process.platform;
}


export class FileUtils {
  static escape(fpath: string) {
    return fpath.replace(/(\s+)/g, '\\$1');
  }
}

export class VSCodeUtils {

  static getActiveTextEditor() {
    return vscode.window.activeTextEditor;
  }

  static getFsPathFromTextEditor(editor: vscode.TextEditor) {
    return editor.document.uri.fsPath;
  }

  static getVersionFromPkg(): string {
    const pkgJSON = fs.readJSONSync(path.join(FileTestUtils.getPkgRoot(__dirname), "package.json"));
    return `${pkgJSON.version}-dev`
  }

  static getWorkspaceFolders(getRoot?: boolean): readonly vscode.WorkspaceFolder[] | vscode.WorkspaceFolder| undefined {
    const wsFolders = vscode.workspace.workspaceFolders;
    if (getRoot) {
      return wsFolders![0];
    } else {
      return wsFolders;
    }
  }

  static async openWS(wsFile: string, context: vscode.ExtensionContext) {
    if (VSCodeUtils.isDebuggingExtension(context)) {
      await context.globalState.update(GLOBAL_STATE.VSCODE_DEBUGGING_EXTENSION, "true");
    }
    return vscode.commands
      .executeCommand(
        "vscode.openFolder",
        vscode.Uri.parse(wsFile)
      );
  }

  static isDebuggingExtension(context: vscode.ExtensionContext): boolean {
    // HACK: vscode does not save env variables btw workspaces
    const isDebugging = context.globalState.get<boolean>(GLOBAL_STATE.VSCODE_DEBUGGING_EXTENSION);
    if (isDebugging) {
      process.env.VSCODE_DEBUGGING_EXTENSION = "true";
      context.globalState.update(GLOBAL_STATE.VSCODE_DEBUGGING_EXTENSION, undefined);
    }
    return process.env.VSCODE_DEBUGGING_EXTENSION || isDebugging ? true : false;
  }
}