import { FileTestUtils } from "@dendronhq/common-server";
import fs from "fs-extra";
import os from "os";
import path from "path";
import * as vscode from "vscode";
import { GLOBAL_STATE } from "./constants";

export class DisposableStore {
  private _toDispose = new Set<vscode.Disposable>();

  public add(dis: vscode.Disposable) {
    this._toDispose.add(dis);
  }

  // TODO
  public dispose() {}
}

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
    return fpath.replace(/(\s+)/g, "\\$1");
  }
}

// NOTE: used for tests
let _MOCK_CONTEXT: undefined | vscode.ExtensionContext = undefined;

export class VSCodeUtils {
  static getActiveTextEditor() {
    return vscode.window.activeTextEditor;
  }

  static getFsPathFromTextEditor(editor: vscode.TextEditor) {
    return editor.document.uri.fsPath;
  }

  static getVersionFromPkg(): string {
    const pkgJSON = fs.readJSONSync(
      path.join(FileTestUtils.getPkgRoot(__dirname), "package.json")
    );
    return `${pkgJSON.version}-dev`;
  }

  static getWorkspaceFolders(): readonly vscode.WorkspaceFolder[];
  static getWorkspaceFolders(
    getRoot?: boolean
  ): vscode.WorkspaceFolder | undefined | readonly vscode.WorkspaceFolder[] {
    let wsFolders;
    wsFolders = vscode.workspace.workspaceFolders;
    if (getRoot) {
      return wsFolders![0];
    } else {
      return wsFolders;
    }
  }

  static getOrCreateMockContext(): vscode.ExtensionContext {
    if (!_MOCK_CONTEXT) {
      const pkgRoot = FileTestUtils.getPkgRoot(__dirname);
      _MOCK_CONTEXT = {
        logPath: "/tmp/dendron-integ/",
        subscriptions: [],
        extensionPath: pkgRoot,
        globalState: VSCodeUtils.createMockState({[GLOBAL_STATE.VERSION]: "0.0.1"}),
        workspaceState: VSCodeUtils.createMockState({}),
        extensionUri: vscode.Uri.parse(pkgRoot),
        environmentVariableCollection: {} as any,
        storagePath: "/tmp/dendron-integ-storage/",
        globalStoragePath: "/tmp/dendron-integ-storage-global/",
        asAbsolutePath: {} as any, //vscode.Uri.parse(wsPath)
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
        return
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
    const uri = vscode.Uri.parse(root);
    return {
      index: 0,
      uri,
      name: path.basename(root),
    };
  }

  static async openWS(wsFile: string) {
    return vscode.commands.executeCommand(
      "vscode.openFolder",
      vscode.Uri.parse(wsFile)
    );
  }

  static isDebuggingExtension(): boolean {
    // HACK: vscode does not save env variables btw workspaces
    return process.env.VSCODE_DEBUGGING_EXTENSION ? true : false;
  }
}
