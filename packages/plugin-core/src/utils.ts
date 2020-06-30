import os from "os";
import * as vscode from "vscode";

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


export class VSCodeUtils {

  static getActiveTextEditor() {
    return vscode.window.activeTextEditor;
  }

  static getFsPathFromTextEditor(editor: vscode.TextEditor) {
    return editor.document.uri.fsPath;
  }

  static async openWS(wsFile: string) {
    vscode.commands
      .executeCommand(
        "vscode.openFolder",
        vscode.Uri.parse(wsFile)
      );
  }
  static isDebuggingExtension(): boolean {
    return process.env.VSCODE_DEBUGGING_EXTENSION ? true : false;
  }
}