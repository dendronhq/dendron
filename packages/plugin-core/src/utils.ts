import { FileTestUtils, resolveTilde } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import os from "os";
import path from "path";
import * as vscode from "vscode";
import { GLOBAL_STATE } from "./constants";
import { FileItem } from "./external/fileutils/FileItem";
import _md from "markdown-it";
import { DendronWorkspace } from "./workspace";

export class DisposableStore {
  private _toDispose = new Set<vscode.Disposable>();

  public add(dis: vscode.Disposable) {
    this._toDispose.add(dis);
  }

  // TODO
  public dispose() {}
}

// === File FUtils
// @DEPRECATE, use src/files.ts#resolvePath
export function resolvePath(filePath: string, wsRoot?: string): string {
  const platform = os.platform();

  const isWin = platform === "win32" ? true : false;
  if (filePath[0] === "~") {
    return resolveTilde(filePath);
  } else if (
    path.isAbsolute(filePath) ||
    (isWin && filePath.startsWith("\\"))
  ) {
    return filePath;
  } else {
    if (!wsRoot) {
      throw Error("can't use rel path without a workspace root set");
    }
    return path.join(wsRoot, filePath);
  }
}

export function getPlatform() {
  return process.platform;
}

export class FileUtils {
  static escape(fpath: string) {
    return fpath.replace(/(\s+)/g, "\\$1");
  }
}

// NOTE: used for tests
let _MOCK_CONTEXT: undefined | vscode.ExtensionContext = undefined;

export class VSCodeUtils {
  static closeCurrentFileEditor() {
    return vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  }

  static closeAllEditors() {
    return vscode.commands.executeCommand("workbench.action.closeAllEditors");
  }

  static getActiveTextEditor() {
    return vscode.window.activeTextEditor;
  }

  static getFsPathFromTextEditor(editor: vscode.TextEditor) {
    return editor.document.uri.fsPath;
  }

  static getSelection() {
    const editor = vscode.window.activeTextEditor as vscode.TextEditor;
    const selection = editor.selection as vscode.Selection;
    const text = editor.document.getText(selection);
    return { text, selection };
  }

  static getVersionFromPkg(): string {
    const pkgJSON = fs.readJSONSync(
      path.join(FileTestUtils.getPkgRoot(__dirname), "package.json")
    );
    return `${pkgJSON.version}`;
  }

  static createWSContext(): vscode.ExtensionContext {
    const pkgRoot = FileTestUtils.getPkgRoot(__dirname);
    const globalState = DendronWorkspace.configuration();
    const workspaceState = DendronWorkspace.configuration("dendron");
    return {
      extensionMode: vscode.ExtensionMode.Development,
      logPath: FileTestUtils.tmpDir().name,
      subscriptions: [],
      extensionPath: pkgRoot,
      globalState,
      workspaceState,
      extensionUri: vscode.Uri.file(pkgRoot),
      environmentVariableCollection: {} as any,
      storagePath: FileTestUtils.tmpDir().name,
      globalStoragePath: FileTestUtils.tmpDir().name,
      asAbsolutePath: {} as any, //vscode.Uri.file(wsPath)
    } as vscode.ExtensionContext;
  }

  static getOrCreateMockContext(): vscode.ExtensionContext {
    if (!_MOCK_CONTEXT) {
      const pkgRoot = FileTestUtils.getPkgRoot(__dirname);
      _MOCK_CONTEXT = {
        extensionMode: vscode.ExtensionMode.Development,
        logPath: FileTestUtils.tmpDir().name,
        subscriptions: [],
        extensionPath: pkgRoot,
        globalState: VSCodeUtils.createMockState({
          [GLOBAL_STATE.VERSION]: "0.0.1",
        }),
        workspaceState: VSCodeUtils.createMockState({}),
        extensionUri: vscode.Uri.file(pkgRoot),
        environmentVariableCollection: {} as any,
        storagePath: FileTestUtils.tmpDir().name,
        globalStoragePath: FileTestUtils.tmpDir().name,
        asAbsolutePath: {} as any, //vscode.Uri.file(wsPath)
      } as vscode.ExtensionContext;
    }
    return _MOCK_CONTEXT;
  }

  static createMockState(settings: any): vscode.WorkspaceConfiguration {
    const _settings = settings;
    return {
      get: (_key: string) => {
        return _settings[_key];
      },
      update: async (_key: string, _value: any) => {
        _settings[_key] = _value;
        return;
      },
      has: (key: string) => {
        return key in _settings;
      },
      inspect: (_section: string) => {
        return _settings;
      },
    };
  }

  static createWSFolder(root: string): vscode.WorkspaceFolder {
    const uri = vscode.Uri.file(root);
    return {
      index: 0,
      uri,
      name: path.basename(root),
    };
  }

  static async openFileInEditor(
    fileItemOrURI: FileItem | vscode.Uri
  ): Promise<vscode.TextEditor | undefined> {
    let textDocument;
    if (fileItemOrURI instanceof FileItem) {
      if (fileItemOrURI.isDir) {
        return;
      }

      textDocument = await vscode.workspace.openTextDocument(
        fileItemOrURI.path
      );
    } else {
      textDocument = await vscode.workspace.openTextDocument(fileItemOrURI);
    }

    if (!textDocument) {
      throw new Error("Could not open file!");
    }

    const editor = await vscode.window.showTextDocument(
      textDocument,
      vscode.ViewColumn.Active
    );
    if (!editor) {
      throw new Error("Could not show document!");
    }

    return editor;
  }

  static async openWS(wsFile: string) {
    return vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.file(wsFile)
    );
  }

  static async gatherFolderPath(opts?: {
    default: string;
  }): Promise<string | undefined> {
    const folderPath = await vscode.window.showInputBox({
      prompt: "Select path to folder",
      ignoreFocusOut: true,
      value: opts?.default,
      validateInput: (input: string) => {
        if (!path.isAbsolute(input)) {
          if (input[0] !== "~") {
            return "must enter absolute path";
          }
        }
        return undefined;
      },
    });
    if (_.isUndefined(folderPath)) {
      return;
    }
    return resolvePath(folderPath);
  }

  static isDebuggingExtension(): boolean {
    // HACK: vscode does not save env variables btw workspaces
    return process.env.VSCODE_DEBUGGING_EXTENSION ? true : false;
  }

  static showInputBox = vscode.window.showInputBox;
  static showQuickPick = vscode.window.showQuickPick;
  static showWebView = (opts: { title: string; content: string }) => {
    const { title, content } = opts;
    const panel = vscode.window.createWebviewPanel(
      _.kebabCase(title),
      title, // Title of the panel displayed to the user
      vscode.ViewColumn.One, // Editor column to show the new webview panel in.
      {} // Webview options. More on these later.
    );
    panel.webview.html = _md().render(content);
  };
}
