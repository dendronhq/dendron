import {
  DendronError,
  DEngineClientV2,
  DNodeUtils,
  DVault,
  getStage,
  NoteProps,
  NoteUtils,
  SchemaModulePropsV2,
  Time,
} from "@dendronhq/common-all";
import {
  goUpTo,
  resolveTilde,
  tmpDir,
  vault2Path,
} from "@dendronhq/common-server";
import _ from "lodash";
import _md from "markdown-it";
import ogs from "open-graph-scraper";
import os from "os";
import path from "path";
import * as vscode from "vscode";
import { CancellationTokenSource } from "vscode-languageclient";
import { PickerUtilsV2 } from "./components/lookup/utils";
import {
  CONFIG,
  ConfigKey,
  GLOBAL_STATE,
  _noteAddBehaviorEnum,
} from "./constants";
import { FileItem } from "./external/fileutils/FileItem";
import { EngineAPIService } from "./services/EngineAPIService";
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

type CreateFnameOverrides = {
  domain?: string;
};

type CreateFnameOpts = {
  overrides?: CreateFnameOverrides;
};

type AddBehavior =
  | "childOfDomain"
  | "childOfCurrent"
  | "asOwnDomain"
  | "childOfDomainNamespace";

export class VSCodeUtils {
  static closeCurrentFileEditor() {
    return vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  }

  static closeAllEditors() {
    return vscode.commands.executeCommand("workbench.action.closeAllEditors");
  }

  static createCancelSource(existingSource?: CancellationTokenSource) {
    const tokenSource = new CancellationTokenSource();
    if (existingSource) {
      existingSource.cancel();
      existingSource.dispose();
    }
    return tokenSource;
  }

  static createQuickPick = vscode.window.createQuickPick;

  static extractRangeFromActiveEditor = async (
    documentParam?: vscode.TextDocument,
    rangeParam?: vscode.Range
  ) => {
    const document = documentParam
      ? documentParam
      : vscode.window.activeTextEditor?.document;

    if (!document || (document && document.languageId !== "markdown")) {
      return;
    }

    const range = rangeParam
      ? rangeParam
      : vscode.window.activeTextEditor?.selection;

    if (!range || (range && range.isEmpty)) {
      return;
    }
    return { document, range };
  };

  static deleteRange = async (
    document: vscode.TextDocument,
    range: vscode.Range
  ) => {
    const editor = await vscode.window.showTextDocument(document);
    await editor.edit((edit) => edit.delete(range));
  };

  static getActiveTextEditor() {
    return vscode.window.activeTextEditor;
  }

  static getFsPathFromTextEditor(editor: vscode.TextEditor) {
    return editor.document.uri.fsPath;
  }

  static getSelection() {
    const editor = vscode.window.activeTextEditor;
    const selection = editor?.selection;
    const text = editor?.document.getText(selection);
    return { text, selection, editor };
  }

  static createWSContext(): vscode.ExtensionContext {
    const pkgRoot = goUpTo(__dirname);
    return ({
      extensionMode: vscode.ExtensionMode.Development,
      logPath: tmpDir().name,
      subscriptions: [] as any[],
      extensionPath: pkgRoot,
      globalState: VSCodeUtils.createMockState({
        [GLOBAL_STATE.VERSION]: "0.0.1",
      }),
      workspaceState: VSCodeUtils.createMockState({}),
      extensionUri: vscode.Uri.file(pkgRoot),
      environmentVariableCollection: {} as any,
      storagePath: tmpDir().name,
      globalStoragePath: tmpDir().name,
      asAbsolutePath: {} as any, //vscode.Uri.file(wsPath)
    } as unknown) as vscode.ExtensionContext;
  }

  static getOrCreateMockContext(): vscode.ExtensionContext {
    if (!_MOCK_CONTEXT) {
      const pkgRoot = goUpTo(__dirname);
      _MOCK_CONTEXT = ({
        extensionMode: vscode.ExtensionMode.Development,
        logPath: tmpDir().name,
        subscriptions: [],
        extensionPath: pkgRoot,
        globalState: VSCodeUtils.createMockState({
          [GLOBAL_STATE.VERSION]: "0.0.1",
        }),
        workspaceState: VSCodeUtils.createMockState({}),
        extensionUri: vscode.Uri.file(pkgRoot),
        environmentVariableCollection: {} as any,
        storagePath: tmpDir().name,
        globalStoragePath: tmpDir().name,
        asAbsolutePath: {} as any, //vscode.Uri.file(wsPath)
      } as unknown) as vscode.ExtensionContext;
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

  static async openNoteByPath({
    vault,
    fname,
  }: {
    vault: DVault;
    fname: string;
  }) {
    const vpath = vault2Path({ vault, wsRoot: DendronWorkspace.wsRoot() });
    const notePath = path.join(vpath, `${fname}.md`);
    const editor = await VSCodeUtils.openFileInEditor(
      vscode.Uri.file(notePath)
    );
    return editor as vscode.TextEditor;
  }

  static async openNote(note: NoteProps) {
    const { vault, fname } = note;
    const wsRoot = DendronWorkspace.wsRoot();
    const vpath = vault2Path({ vault, wsRoot });
    const notePath = path.join(vpath, `${fname}.md`);
    const editor = await VSCodeUtils.openFileInEditor(
      vscode.Uri.file(notePath)
    );
    return editor as vscode.TextEditor;
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

  static async reloadWindow() {
    if (getStage() !== "test") {
      await vscode.commands.executeCommand("workbench.action.reloadWindow");
    }
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

export class WSUtils {
  static updateEngineAPI(port: number | string): DEngineClientV2 {
    const ws = DendronWorkspace.instance();
    ws.setEngine(EngineAPIService.create({ port }));
    ws.port = _.toInteger(port);
    const engine = ws.getEngine();
    return engine;
  }
}

export class DendronClientUtilsV2 {
  static genNotePrefix(
    fname: string,
    addBehavior: AddBehavior,
    opts: { engine: DEngineClientV2 }
  ) {
    let out: string;
    switch (addBehavior) {
      case "childOfDomain": {
        out = DNodeUtils.domainName(fname);
        break;
      }
      case "childOfDomainNamespace": {
        out = DNodeUtils.domainName(fname);
        const vault = PickerUtilsV2.getOrPromptVaultForOpenEditor();
        const domain = NoteUtils.getNoteByFnameV5({
          fname,
          notes: opts.engine.notes,
          vault,
          wsRoot: DendronWorkspace.wsRoot(),
        });
        if (domain && domain.schema) {
          const smod = opts.engine.schemas[domain.schema.moduleId];
          const schema = smod.schemas[domain.schema.schemaId];
          if (schema && schema.data.namespace) {
            out = NoteUtils.getPathUpTo(fname, 2);
          }
        }
        break;
      }
      case "childOfCurrent": {
        out = fname;
        break;
      }
      case "asOwnDomain": {
        out = "";
        break;
      }
      default: {
        throw Error(`unknown add Behavior: ${addBehavior}`);
      }
    }
    return out;
  }

  /**
   * Generates a file name for a journal or scratch note. Must be derived by an
   * open note, or passed as an option.
   * @param type 'JOURNAL' | 'SCRATCH'
   * @param opts Options to control how the note will be named
   * @returns The file name of the new note
   */
  static genNoteName(
    type: "JOURNAL" | "SCRATCH",
    opts?: CreateFnameOpts
  ): string {
    // gather inputs
    const dateFormatKey: ConfigKey = `DEFAULT_${type}_DATE_FORMAT` as ConfigKey;
    const dateFormat = DendronWorkspace.configuration().get<string>(
      CONFIG[dateFormatKey].key
    ) as string;
    const addKey = `DEFAULT_${type}_ADD_BEHAVIOR` as ConfigKey;
    const addBehavior = DendronWorkspace.configuration().get<string>(
      CONFIG[addKey].key
    );
    const nameKey: ConfigKey = `DEFAULT_${type}_NAME` as ConfigKey;
    const name = DendronWorkspace.configuration().get<string>(
      CONFIG[nameKey].key
    );
    if (!_.includes(_noteAddBehaviorEnum, addBehavior)) {
      throw Error(
        `${
          CONFIG[addKey].key
        } must be one of following ${_noteAddBehaviorEnum.join(", ")}`
      );
    }

    const editorPath = vscode.window.activeTextEditor?.document.uri.fsPath;
    const currentNoteFname =
      opts?.overrides?.domain ||
      (editorPath ? path.basename(editorPath, ".md") : undefined);
    if (!currentNoteFname) {
      throw Error("Must be run from within a note");
    }

    const engine = DendronWorkspace.instance().getEngine();
    const prefix = DendronClientUtilsV2.genNotePrefix(
      currentNoteFname,
      addBehavior as AddBehavior,
      {
        engine,
      }
    );

    const noteDate = Time.now().toFormat(dateFormat);
    return [prefix, name, noteDate].filter((ent) => !_.isEmpty(ent)).join(".");
  }

  static getSchemaModByFname = async ({
    fname,
    client,
  }: {
    fname: string;
    client: DEngineClientV2;
  }): Promise<SchemaModulePropsV2> => {
    const smod = _.find(client.schemas, { fname });
    if (!smod) {
      throw new DendronError({ msg: "no note found" });
    }
    return smod;
  };

  static getVault({
    dirname,
  }: {
    dirname: string;
    engine: DEngineClientV2;
  }): DVault {
    return {
      fsPath: dirname,
    };
  }
}

export const clipboard = vscode.env.clipboard;

// This layer of indirection is only here enable stubbing a top level function that's the default export of a module // https://github.com/sinonjs/sinon/issues/562#issuecomment-399090111
// Otherwise, we can't mock it for testing.
export const getOpenGraphMetadata = (opts: ogs.Options) => {
  return ogs(opts);
};
