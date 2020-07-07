import { FileTestUtils } from "@dendronhq/common-server";
import fs from "fs-extra";
import os from "os";
import path from "path";
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
    let wsFolders;
    wsFolders = vscode.workspace.workspaceFolders;
    if (getRoot) {
      return wsFolders![0];
    } else {
      return wsFolders;
    }
  }

  static createWSFolder(root: string): vscode.WorkspaceFolder {
    const uri = vscode.Uri.parse(root);
    return {
      index: 0,
      uri,
      name: path.basename(root)
    }
  }

  static async openWS(wsFile: string) {
    return vscode.commands
      .executeCommand(
        "vscode.openFolder",
        vscode.Uri.parse(wsFile)
      );
  }

  static isDebuggingExtension(): boolean {
    // HACK: vscode does not save env variables btw workspaces
    return process.env.VSCODE_DEBUGGING_EXTENSION ? true : false;
  }
}