import {
  assertUnreachable,
  CONSTANTS,
  DendronError,
  getStage,
  InstallStatus,
  newRange,
  Point,
  Position,
  VSRange,
} from "@dendronhq/common-all";
import { goUpTo, resolvePath, tmpDir } from "@dendronhq/common-server";
import _ from "lodash";
import _md from "markdown-it";
import os from "os";
import path from "path";
import * as vscode from "vscode";
import { CancellationTokenSource } from "vscode";
import { DendronContext, GLOBAL_STATE } from "./constants";
import { FileItem } from "./external/fileutils/FileItem";
// NOTE: This file should NOT have a dependency on getDWorkspace()/getExtension()
// If you would like to introduce a utility for workspace add it to IWSUtilsV2/WSUtilsV2.

type PointOffset = { line?: number; column?: number };

// NOTE: used for tests
let _MOCK_CONTEXT: undefined | vscode.ExtensionContext;

/** The severity of a message shown by {@link VSCodeUtils.showMessage}.
 *
 * The function will call `vscode.window.show(Information|Warning|Error)Message` with the parameters given to it.
 *
 * The severities map to numbers for easy comparison, `INFO < WARN && WARN < ERROR`.
 */
export enum MessageSeverity {
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * IMPORTANT: Do not import from  workspace.ts from this file. Any utils that
 * depend on workspace must go into WSUtils, otherwise this will create circular
 * dependencies.
 */
export class VSCodeUtils {
  /**
   * In development, this is `packages/plugin-core/assets`
   * In production, this is `$HOME/$VSCODE_DIR/{path-to-app}/dist/
   * @param context
   * @returns
   */
  static getAssetUri(context: vscode.ExtensionContext) {
    if (getStage() === "dev")
      return VSCodeUtils.joinPath(context.extensionUri, "assets");
    return VSCodeUtils.joinPath(context.extensionUri, "dist");
  }

  static closeCurrentFileEditor() {
    return vscode.commands.executeCommand("workbench.action.closeActiveEditor");
  }

  static closeAllEditors() {
    const closeEditorsCmd = vscode.commands.executeCommand(
      "workbench.action.closeAllEditors"
    );
    const closeGroupsCmd = vscode.commands.executeCommand(
      "workbench.action.closeAllGroups"
    );

    return Promise.all([closeEditorsCmd, closeGroupsCmd]);
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
    const document = documentParam || vscode.window.activeTextEditor?.document;

    if (!document || (document && document.languageId !== "markdown")) {
      return;
    }

    const range = rangeParam || vscode.window.activeTextEditor?.selection;

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

  /** Wraps the selected range with comment symbols using builtin VSCode command. */
  static async makeBlockComment(
    editor: vscode.TextEditor,
    range?: vscode.Range
  ) {
    // The command doesn't accept any arguments, it uses the current selection.
    // So save then restore the selection.
    const selectionsBefore = editor.selections;
    if (range) {
      editor.selection = new vscode.Selection(range?.start, range?.end);
    }
    await vscode.commands.executeCommand("editor.action.blockComment");
    editor.selections = selectionsBefore;
  }

  static getActiveTextEditor() {
    return vscode.window.activeTextEditor;
  }

  static getActiveTextEditorOrThrow() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      throw new DendronError({ message: "no active editor" });
    }
    return editor;
  }

  static getFsPathFromTextEditor(editor: vscode.TextEditor) {
    return editor.document.uri.fsPath;
  }

  /**
   * Check if we upgraded, initialized for the first time or no change was detected
   * @returns {@link InstallStatus}
   */
  static getInstallStatusForWorkspace({
    previousWorkspaceVersion,
    currentVersion,
  }: {
    previousWorkspaceVersion?: string;
    currentVersion: string;
  }): InstallStatus {
    if (
      _.isUndefined(previousWorkspaceVersion) ||
      previousWorkspaceVersion === CONSTANTS.DENDRON_INIT_VERSION
    ) {
      return InstallStatus.INITIAL_INSTALL;
    }
    if (previousWorkspaceVersion !== currentVersion) {
      return InstallStatus.UPGRADED;
    }
    return InstallStatus.NO_CHANGE;
  }

  /**
   * Get {@link InstallStatus}
   * ^pubko8e3tu7i
   */
  static getInstallStatusForExtension({
    previousGlobalVersion,
    currentVersion,
  }: {
    previousGlobalVersion?: string;
    currentVersion: string;
  }): InstallStatus {
    // if there is no global version set, then its a new install
    if (
      _.isUndefined(previousGlobalVersion) ||
      previousGlobalVersion === CONSTANTS.DENDRON_INIT_VERSION
    ) {
      return InstallStatus.INITIAL_INSTALL;
    }
    if (previousGlobalVersion !== currentVersion) {
      return InstallStatus.UPGRADED;
    }
    return InstallStatus.NO_CHANGE;
  }

  static getSelection():
    | { text: undefined; selection: undefined; editor: undefined }
    | { text: string; selection: vscode.Selection; editor: vscode.TextEditor } {
    const editor = vscode.window.activeTextEditor;
    if (_.isUndefined(editor))
      return { text: undefined, selection: undefined, editor: undefined };
    const selection = editor.selection;
    const text = editor.document.getText(selection);
    return { text, selection, editor };
  }

  // create mock context for testing ^7a83pznb91c8
  static getOrCreateMockContext(): vscode.ExtensionContext {
    if (!_MOCK_CONTEXT) {
      const logPath = tmpDir().name;
      const pkgRoot = goUpTo({ base: __dirname, fname: "package.json" });
      _MOCK_CONTEXT = {
        extensionMode: vscode.ExtensionMode.Development,
        logPath,
        logUri: vscode.Uri.file(logPath),
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
        extension: {
          id: "dummy",
        },
      } as unknown as vscode.ExtensionContext;
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

  /**
   * URI.joinPath currentl'y doesn't work in theia
   * @param uri
   * @param path
   */
  static joinPath(uri: vscode.Uri, ...fpath: string[]) {
    return vscode.Uri.file(path.join(uri.fsPath, ...fpath));
  }

  static async openFileInEditor(
    fileItemOrURI: FileItem | vscode.Uri,
    opts?: Partial<{
      column: vscode.ViewColumn;
    }>
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

    const col = opts?.column || vscode.ViewColumn.Active;

    const editor = await vscode.window.showTextDocument(textDocument, col);
    if (!editor) {
      throw new Error("Could not show document!");
    }

    return editor;
  }

  static openLink(link: string) {
    vscode.commands.executeCommand("vscode.open", vscode.Uri.parse(link));
  }

  closeAllEditors() {
    return vscode.commands.executeCommand("workbench.action.closeAllEditors");
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

  /**
   * Opens file picker which allows user to select a file or folder
   *
   * @param options Options to configure the behaviour of a file open dialog
   * @returns Filesystem path
   */
  static async openFilePicker(options?: vscode.OpenDialogOptions) {
    const fileUri = await vscode.window.showOpenDialog(options);

    if (fileUri && fileUri[0]) {
      return fileUri[0].fsPath;
    }
    return;
  }

  /** Prompt the user for an absolute path to a folder. Supports `~`.
   *
   * @param opts.default The default path to suggest.
   * @param opts.relativeTo If given, this should be an absolute folder prefix. Anything the user types will be prefixed with this.
   * @param opts.override Use to override the prompts suggestions.
   * @returns
   */
  static async gatherFolderPath(opts?: {
    default: string;
    relativeTo?: string;
    override?: Partial<vscode.InputBoxOptions>;
  }): Promise<string | undefined> {
    let folderPath = await vscode.window.showInputBox({
      prompt: "Select path to folder",
      ignoreFocusOut: true,
      value: opts?.default,
      validateInput: (input: string) => {
        if (opts?.relativeTo) input = path.join(opts.relativeTo, input);
        if (!path.isAbsolute(input)) {
          if (input[0] !== "~") {
            return "must enter absolute path";
          }
        }
        return undefined;
      },
      ...opts?.override,
    });
    if (_.isUndefined(folderPath)) {
      return;
    }
    if (opts?.relativeTo) folderPath = path.join(opts.relativeTo, folderPath);
    return resolvePath(folderPath);
  }

  static isDevMode(): boolean {
    // HACK: vscode does not save env variables btw workspaces
    return !!process.env.VSCODE_DEBUGGING_EXTENSION;
  }

  static setContext(key: DendronContext, status: boolean) {
    vscode.commands.executeCommand("setContext", key, status);
  }

  static setContextStringValue(key: DendronContext, value: string) {
    vscode.commands.executeCommand("setContext", key, value);
  }

  static showInputBox = vscode.window.showInputBox;
  static showQuickPick = vscode.window.showQuickPick;
  static showWebView = (opts: {
    title: string;
    content: string;
    rawHTML?: boolean;
  }) => {
    const { title, content, rawHTML } = opts;
    const panel = vscode.window.createWebviewPanel(
      _.kebabCase(title),
      title, // Title of the panel displayed to the user
      vscode.ViewColumn.One, // Editor column to show the new webview panel in.
      {} // Webview options. More on these later.
    );
    panel.webview.html = rawHTML ? content : _md().render(content);
  };

  static showMessage(
    severity: MessageSeverity,
    ...opts: Parameters<typeof vscode.window["showInformationMessage"]>
  ) {
    switch (severity) {
      case MessageSeverity.INFO:
        return vscode.window.showInformationMessage(...opts);
      case MessageSeverity.WARN:
        return vscode.window.showWarningMessage(...opts);
      case MessageSeverity.ERROR:
        return vscode.window.showErrorMessage(...opts);
      default:
        assertUnreachable(severity);
    }
  }

  /** Convert a `Point` from a parsed remark node to a `vscode.Poisition`
   *
   * @param point The point to convert.
   * @param offset When converting the point, shift it by this much.
   * @returns The converted Position, shifted by `offset` if provided.
   */
  static point2VSCodePosition(point: Point, offset?: PointOffset) {
    return new vscode.Position(
      // remark Point's are 0 indexed
      point.line - 1 + (offset?.line || 0),
      point.column - 1 + (offset?.column || 0)
    );
  }

  /** Convert a `Position` from a parsed remark node to a `vscode.Range`
   *
   * @param position The position to convert.
   * @returns The converted Range.
   */
  static position2VSCodeRange(position: Position, offset?: PointOffset) {
    return new vscode.Range(
      // remark Point's are 0 indexed
      this.point2VSCodePosition(position.start, offset),
      this.point2VSCodePosition(position.end, offset)
    );
  }

  /** Given a `range`, extend the start and end lines of the range by `padding` many lines.
   *
   * @param opts.range The range to extend.
   * @param opts.padding The number of lines to extend the range.
   * @param zeroCharacter If true, the starting and ending characters of the range will be set to 0.
   * @returns
   */
  static padRange(opts: {
    range: vscode.Range;
    padding: number;
    zeroCharacter?: boolean;
  }): vscode.Range {
    const { range, padding, zeroCharacter } = opts;
    return new vscode.Range(
      new vscode.Position(
        Math.max(range.start.line - padding, 0),
        zeroCharacter ? 0 : range.start.character
      ),
      new vscode.Position(
        range.end.line + padding,
        zeroCharacter ? 0 : range.end.character
      )
    );
  }

  /** Given a list of ranges, return a set of ranges where any overlapping ranges have been merged together. No two returned range will overlap. */
  static mergeOverlappingRanges(ranges: vscode.Range[]): vscode.Range[] {
    const out: vscode.Range[] = [];
    ranges = _.sortBy(
      ranges,
      (range) => range.start.line,
      (range) => range.start.character
    );
    // Reverse them so `.pop()` gives us the earliest list element.
    ranges.reverse();

    while (ranges.length > 0) {
      // Get the earliest range
      let earliest = ranges.pop();
      if (!earliest) break;
      while (ranges.length > 0) {
        // If the next range overlaps...
        const next = ranges[ranges.length - 1]; // what pop would have returned
        if (earliest.intersection(next) === undefined) break; // no overlap
        // Then extend this range
        earliest = earliest.union(next);
        // And remove the next range because it's now part of the current one
        ranges.pop();
        // Continue until we get to a non-overlapping range
      }
      out.push(earliest);
    }
    return out;
  }

  /** Converts any range similar to a VSCode range into an actual VSCode range, which is needed for VSCode APIs. */
  static toRangeObject(range: VSRange): vscode.Range {
    return new vscode.Range(
      range.start.line,
      range.start.character,
      range.end.line,
      range.end.character
    );
  }

  /** Opposite of `toRangeObject`, which is required to call Dendron APIs. */
  static toPlainRange(range: vscode.Range): VSRange {
    return newRange(
      range.start.line,
      range.start.character,
      range.end.line,
      range.end.character
    );
  }

  /** Fold the foldable region at the given line for the active editor.
   *
   * This is equivalent to selecting that point, and using the "Fold" command in the editor.
   */
  static foldActiveEditorAtPosition(opts: { line?: number; levels?: number }) {
    return vscode.commands.executeCommand("editor.fold", {
      selectionLines: [opts.line],
      levels: opts.levels,
    });
  }

  /** Use the built-in markdown preview to display preview for a file. */
  static showDefaultPreview(uri?: vscode.Uri) {
    return vscode.commands.executeCommand("markdown.showPreview", uri);
  }

  static getCodeUserConfigDir() {
    const CODE_RELEASE_MAP = {
      VSCodium: "VSCodium",
      "Visual Studio Code - Insiders": "Code - Insiders",
    };
    const vscodeRelease = vscode.env.appName;
    const name = _.get(CODE_RELEASE_MAP, vscodeRelease, "Code");

    const osName = os.type();
    let delimiter = "/";
    let userConfigDir;

    switch (osName) {
      case "Darwin": {
        userConfigDir =
          process.env.HOME + "/Library/Application Support/" + name + "/User/";
        break;
      }
      case "Linux": {
        userConfigDir = process.env.HOME + "/.config/" + name + "/User/";
        break;
      }
      case "Windows_NT": {
        userConfigDir = process.env.APPDATA + "\\" + name + "\\User\\";
        delimiter = "\\";
        break;
      }
      default: {
        userConfigDir = process.env.HOME + "/.config/" + name + "/User/";
        break;
      }
    }

    // if vscode is in portable mode, we need to handle it differently
    // there is also a case where the user opens vscode with a custom `--user-data-dir` args through the CLI,
    // but there is no reliable way for the extension authors to identify that through the node env or vscode API
    const portableDir = process.env["VSCODE_PORTABLE"];
    if (portableDir) {
      userConfigDir = path.join(portableDir, "user-data", "User");
    }

    return {
      userConfigDir,
      delimiter,
      osName,
    };
  }

  static getWorkspaceConfig = vscode.workspace.getConfiguration;
  static setWorkspaceConfig(
    section: string,
    value: any,
    configurationTarget?: vscode.ConfigurationTarget | boolean | null
  ) {
    const config = vscode.workspace.getConfiguration();
    config.update(section, value, configurationTarget);
  }

  static isExtensionInstalled(extensionId: string) {
    return !_.isUndefined(vscode.extensions.getExtension(extensionId));
  }

  static isTextDocument(obj: any): obj is vscode.TextDocument {
    return (
      obj.uri !== undefined &&
      _.isString(obj.fileName) &&
      _.isNumber(obj.lineCount)
    );
  }
}
