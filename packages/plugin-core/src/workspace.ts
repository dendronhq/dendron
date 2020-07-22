import {
  DEngine,
  DNodeUtils,
  getStage,
  Note,
  NoteUtils
} from "@dendronhq/common-all";
import { cleanName, mdFile2NodeProps } from "@dendronhq/common-server";
import { DendronEngine } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import moment from "moment";
import open from "open";
import path, { posix } from "path";
import * as vscode from "vscode";
import { ImportPodCommand } from "./commands/ImportPod";
import { ReloadIndexCommand } from "./commands/ReloadIndex";
import { UpgradeSettingsCommand } from "./commands/UpgradeSettings";
import { LookupController } from "./components/lookup/LookupController";
import { node2Uri } from "./components/lookup/utils";
import {
  CONFIG,
  DENDRON_COMMANDS,
  DENDRON_WS_NAME,
  extensionQualifiedId,
  GLOBAL_STATE
} from "./constants";
import { Logger } from "./logger";
import { HistoryService } from "./services/HistoryService";
import { NodeService } from "./services/nodeService/NodeService";
import { Extensions, WorkspaceConfig } from "./settings";
import {
  DisposableStore,
  resolvePath,
  resolveTilde,
  VSCodeUtils
} from "./utils";
import { isAnythingSelected } from "./utils/editor";

let _DendronWorkspace: DendronWorkspace | null;

export class DendronWorkspace {
  static DENDRON_WORKSPACE_FILE: string = "dendron.code-workspace";

  static instance(): DendronWorkspace {
    if (!_DendronWorkspace) {
      throw Error("Dendronworkspace not initialized");
    }
    return _DendronWorkspace;
  }

  /**
   * Workspace configuration
   */
  static configuration(): vscode.WorkspaceConfiguration {
    // the reason this is static is so we can stub it for tests
    return vscode.workspace.getConfiguration();
  }

  static workspaceFile(): vscode.Uri {
    if (!vscode.workspace.workspaceFile) {
      throw Error("no workspace file");
    }
    return vscode.workspace.workspaceFile;
  }

  static workspaceFolders(): readonly vscode.WorkspaceFolder[] | undefined {
    return vscode.workspace.workspaceFolders;
  }

  static isActive(): boolean {
    const conf = DendronWorkspace.configuration().get("dendron.rootDir");
    if (conf) {
      return true;
    } else {
      return false;
    }
  }

  static async resetConfig(globalState: vscode.Memento) {
    return await Promise.all(
      _.keys(GLOBAL_STATE).map((k) => {
        const _key = GLOBAL_STATE[k as keyof typeof GLOBAL_STATE];
        return globalState.update(_key, undefined);
      })
    );
  }

  public context: vscode.ExtensionContext;
  public fsWatcher?: vscode.FileSystemWatcher;
  public L: typeof Logger;
  private _engine?: DEngine;
  public version: string;
  private disposableStore: DisposableStore;
  private history: HistoryService;

  constructor(
    context: vscode.ExtensionContext,
    opts?: { skipSetup?: boolean }
  ) {
    opts = _.defaults(opts, { skipSetup: false });
    this.context = context;
    _DendronWorkspace = this;
    this.L = Logger;
    this.disposableStore = new DisposableStore();
    this.history = HistoryService.instance();
    this.version = this._getVersion();
    if (!opts.skipSetup) {
      this._setupCommands();
    }
  }

  get engine(): DEngine {
    if (!this._engine) {
      throw Error("engine not initialized");
    }
    return this._engine;
  }

  get rootDir(): string {
    const rootDir = DendronWorkspace.configuration().get<string>(
      `dendron.${CONFIG.ROOT_DIR}`
    );
    if (!rootDir) {
      throw Error("rootDir not initialized");
    }

    return resolvePath(rootDir, DendronWorkspace.workspaceFile().fsPath);
  }

  get rootWorkspace(): vscode.WorkspaceFolder {
    const wsFolders = DendronWorkspace.workspaceFolders();
    if (_.isEmpty(wsFolders) || _.isUndefined(wsFolders)) {
      throw Error("no ws folders");
    }
    return wsFolders[0] as vscode.WorkspaceFolder;
  }

  get extensionAssetsDir(): vscode.Uri {
    const assetsDir = vscode.Uri.file(
      path.join(this.context.extensionPath, "assets")
    );
    return assetsDir;
  }

  private _getVersion(): string {
    const ctx = "_getVersion";
    let version: string;
    if (VSCodeUtils.isDebuggingExtension()) {
      version = VSCodeUtils.getVersionFromPkg();
    } else {
      try {
        const dendronExtension = vscode.extensions.getExtension(
          extensionQualifiedId
        )!;
        version = dendronExtension.packageJSON.version;
      } catch (err) {
        this.L.info({ ctx, msg: "fetching from file", dir: __dirname });
        version = VSCodeUtils.getVersionFromPkg();
      }
    }
    this.L.info({ ctx, version: this.version });
    return version;
  }

  _setupCommands() {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(DENDRON_COMMANDS.INIT_WS, async () => {
        const ctx = DENDRON_COMMANDS.INIT_WS;
        const rootDirDefault = path.join(resolveTilde("~"), "Dendron");
        const resp = await vscode.window.showInputBox({
          value: rootDirDefault,
          prompt: "Select your default folder for dendron",
          ignoreFocusOut: true,
        });
        if (!resp) {
          this.L.error({ ctx, msg: "no input" });
          // TODO
          throw Error("must enter");
        }
        this.setupWorkspace(resp);
      })
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.CREATE_SCRATCH_NOTE,
        async () => {
          const ctx = DENDRON_COMMANDS.CREATE_SCRATCH_NOTE;
          const defaultNameConfig = "Y-MM-DD-HHmmss";
          const scratchDomain = "scratch";
          const noteName = moment().format(defaultNameConfig);
          const fname = `${scratchDomain}.${noteName}`;
          const title = await vscode.window.showInputBox({
            prompt: "Title",
            ignoreFocusOut: true,
            placeHolder: "scratch",
          });
          const node = new Note({ fname, title });
          const uri = node2Uri(node);
          const historyService = HistoryService.instance();
          historyService.add({ source: "engine", action: "create", uri });
          await DendronEngine.getOrCreateEngine().write(node, {
            newNode: true,
            parentsAsStubs: true,
          });
          this.L.info({ ctx: `${ctx}:write:done`, uri });
          await vscode.window.showTextDocument(uri);
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.CREATE_JOURNAL_NOTE,
        async () => {
          const ctx = DENDRON_COMMANDS.CREATE_JOURNAL_NOTE;
          const defaultNameConfig = "Y-MM-DD-HHmmss";
          const journalNamespace = "journal";
          const noteName = moment().format(defaultNameConfig);
          const editorPath =
            vscode.window.activeTextEditor?.document.uri.fsPath;
          if (!editorPath) {
            throw Error("not currently in a note");
          }
          const cNoteFname = posix.basename(editorPath, ".md");
          const currentDomain = DNodeUtils.domainName(cNoteFname);
          let fname = `${currentDomain}.${journalNamespace}.${noteName}`;
          const title = await vscode.window.showInputBox({
            prompt: "Title",
            ignoreFocusOut: true,
            value: fname,
          });
          if (title) {
            fname = `${cleanName(title)}`;
          }
          const node = new Note({ fname, title });
          const uri = node2Uri(node);
          const historyService = HistoryService.instance();
          historyService.add({ source: "engine", action: "create", uri });
          await DendronEngine.getOrCreateEngine().write(node, {
            newNode: true,
            parentsAsStubs: true,
          });

          const cNote = _.find(this.engine.notes, { fname: cNoteFname });
          if (!cNote) {
            throw Error("cNote undefined");
          }
          const cNoteNew = new Note({
            ...mdFile2NodeProps(editorPath),
            parent: cNote.parent,
            children: cNote.children,
            id: cNote.id,
          });
          NoteUtils.addBackLink(cNoteNew, node);
          await this.engine.write(cNoteNew);

          // done
          this.L.info({ ctx: `${ctx}:write:done`, uri });
          await vscode.window.showTextDocument(uri);
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.CREATE_RECORD_NOTE,
        async () => {
          const ctx = DENDRON_COMMANDS.CREATE_RECORD_NOTE;
          const defaultNameConfig = "Y-MM-DD-HHmmss";
          const journalNamespace = "record";
          const noteName = moment().format(defaultNameConfig);
          const editorPath =
            vscode.window.activeTextEditor?.document.uri.fsPath;
          if (!editorPath) {
            throw Error("not currently in a note");
          }
          const cNoteFname = posix.basename(editorPath, ".md");
          const currentDomain = DNodeUtils.domainName(cNoteFname);
          let fname = `${currentDomain}.${journalNamespace}.${noteName}`;
          const title = await vscode.window.showInputBox({
            prompt: "Title",
            ignoreFocusOut: true,
            value: fname,
          });
          if (title) {
            fname = `${cleanName(title)}`;
          }
          const node = new Note({ fname, title });
          const uri = node2Uri(node);
          const historyService = HistoryService.instance();
          historyService.add({ source: "engine", action: "create", uri });
          await DendronEngine.getOrCreateEngine().write(node, {
            newNode: true,
            parentsAsStubs: true,
          });

          const cNote = _.find(this.engine.notes, { fname: cNoteFname });
          if (!cNote) {
            throw Error("cNote undefined");
          }
          const cNoteNew = new Note({
            ...mdFile2NodeProps(editorPath),
            parent: cNote.parent,
            children: cNote.children,
            id: cNote.id,
          });
          NoteUtils.addBackLink(cNoteNew, node);
          await this.engine.write(cNoteNew);

          // done
          this.L.info({ ctx: `${ctx}:write:done`, uri });
          await vscode.window.showTextDocument(uri);
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(DENDRON_COMMANDS.CHANGE_WS, async () => {
        const ctx = DENDRON_COMMANDS.CHANGE_WS;
        const resp = await vscode.window.showInputBox({
          prompt: "Select your folder for dendron",
          ignoreFocusOut: true,
          validateInput: (input: string) => {
            if (!path.isAbsolute(input)) {
              return "must enter absolute path";
            }
            return undefined;
          },
        });
        if (!resp) {
          this.L.error({ ctx, msg: "no input" });
          // TODO
          throw Error("must enter");
        }
        this.changeWorkspace(resp);
      })
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(DENDRON_COMMANDS.RELOAD_WS, async () => {
        await this.reloadWorkspace();
        vscode.window.showInformationMessage(`ws reloaded`);
      })
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.RESET_CONFIG,
        async () => {
          await Promise.all(
            _.keys(GLOBAL_STATE).map((k) => {
              this.updateGlobalState(k as keyof typeof GLOBAL_STATE, undefined);
            })
          );
          vscode.window.showInformationMessage(`reset config`);
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(DENDRON_COMMANDS.LOOKUP, async () => {
        const ctx = DENDRON_COMMANDS.LOOKUP;
        this.L.info({ ctx: ctx + ":LookupController:pre" });
        const controller = new LookupController(this);
        this.L.info({ ctx: ctx + ":LookupController:post" });
        controller.show();
      })
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.DELETE_NODE,
        async () => {
          const ctx = DENDRON_COMMANDS.DELETE_NODE;
          this.L.info({ ctx });
          const ns = new NodeService();
          const fsPath = VSCodeUtils.getFsPathFromTextEditor(
            VSCodeUtils.getActiveTextEditor() as vscode.TextEditor
          );

          this.history.add({
            source: "engine",
            action: "delete",
            uri: vscode.Uri.file(fsPath),
          });
          const note: Note = (await ns.deleteByPath(fsPath, "note")) as Note;
          const closetParent = DNodeUtils.findClosestParent(
            note.logicalPath,
            this.engine.notes,
            { noStubs: true }
          );
          const uri = node2Uri(closetParent);
          try {
            await vscode.window.showTextDocument(uri);
          } catch (err) {
            this.L.error({ ctx, msg: `can't open uri: ${uri}` });
          }
          vscode.window.showInformationMessage(
            `${posix.basename(fsPath)} deleted`
          );
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(DENDRON_COMMANDS.OPEN_LINK, async () => {
        const ctx = DENDRON_COMMANDS.OPEN_LINK;
        this.L.info({ ctx });
        if (!isAnythingSelected()) {
          return vscode.window.showErrorMessage("nothing selected");
        }
        const editor = vscode.window.activeTextEditor as vscode.TextEditor;
        const selection = editor.selection as vscode.Selection;
        const text = editor.document.getText(selection);
        const assetPath = resolvePath(text, this.rootWorkspace.uri.fsPath);
        if (!fs.existsSync(assetPath)) {
          return vscode.window.showErrorMessage(`${assetPath} does not exist`);
        }
        return open(assetPath).catch((err) => {
          vscode.window.showInformationMessage("error: " + JSON.stringify(err));
        });
      })
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(DENDRON_COMMANDS.IMPORT_POD, async () => {
        const wsRoot = this.rootWorkspace.uri.fsPath;
        await new ImportPodCommand().execute({ wsRoot });
        vscode.window.showInformationMessage(`pod import`);
      })
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.RELOAD_INDEX,
        async (silent?: boolean) => {
          const root = this.rootWorkspace.uri.fsPath;
          await new ReloadIndexCommand().execute({ root });
          if (!silent) {
            vscode.window.showInformationMessage(`finish reload`);
          }
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.UPGRADE_SETTINGS,
        async () => {
          await new UpgradeSettingsCommand().execute({
            settingOpts: { force: true },
          });
        }
      )
    );
  }

  // === Utils

  getGlobalState<T>(key: keyof typeof GLOBAL_STATE) {
    const _key = GLOBAL_STATE[key];
    return this.context.globalState.get<T>(_key);
  }

  updateGlobalState(key: keyof typeof GLOBAL_STATE, value: any) {
    const _key = GLOBAL_STATE[key];
    return this.context.globalState.update(_key, value);
  }

  // === Workspace
  /**
   * - get workspace config and workspace folder
   * - activate workspacespace watchers
   */
  async activateWorkspace() {
    const ctx = "activateWorkspace";
    let workspaceFolders: readonly vscode.WorkspaceFolder[] = [];

    const wsFolders = DendronWorkspace.workspaceFolders();
    if (_.isUndefined(wsFolders) || _.isEmpty(wsFolders)) {
      this.L.error({
        ctx,
        msg: "no folders set for workspace",
        action: "Please set folder",
      });
      throw Error("no folders set for workspace");
    }
    workspaceFolders = wsFolders;
    if (getStage() !== "test") {
      this.createWorkspaceWatcher(workspaceFolders);
    }
  }

  async createWorkspaceWatcher(
    workspaceFolders: readonly vscode.WorkspaceFolder[]
  ) {
    const ctx = "createWorkspaceWatcher";
    this.L.info({ ctx });
    const rootFolder = workspaceFolders[0];
    let pattern = new vscode.RelativePattern(rootFolder, "*.md");
    this.fsWatcher = vscode.workspace.createFileSystemWatcher(
      pattern,
      false,
      true,
      false
    );

    this.disposableStore.add(
      this.fsWatcher.onDidCreate(async (uri: vscode.Uri) => {
        const ctx = "fsWatcher.onDidCreate";
        this.L.info({ ctx, uri });
        const fname = posix.basename(uri.fsPath, ".md");
        const note = new Note({ fname });

        // check if ignore
        const recentEvents = HistoryService.instance().lookBack();
        this.L.debug({ ctx, recentEvents, fname });
        if (
          _.find(recentEvents, (event) => {
            return _.every([
              event?.uri?.fsPath === uri.fsPath,
              event.source === "engine",
              event.action === "create",
            ]);
          })
        ) {
          this.L.debug({ ctx, uri, msg: "create by engine, ignoring" });
          return;
        }

        try {
          this.engine.updateNodes([note], {
            newNode: true,
            parentsAsStubs: true,
          });
        } catch (err) {
          this.L.error({ ctx, err });
        }
      }, this)
    );
    this.disposableStore.add(
      this.fsWatcher.onDidDelete(async (uri: vscode.Uri) => {
        const ctx = "fsWatcher.onDidDelete";
        this.L.info({ ctx, uri });
        const fname = posix.basename(uri.fsPath, ".md");

        // check if we should ignore
        const recentEvents = HistoryService.instance().lookBack();
        this.L.debug({ ctx, recentEvents, fname });
        if (
          _.find(recentEvents, (event) => {
            return _.every([
              event?.uri?.fsPath === uri.fsPath,
              event.source === "engine",
              event.action === "delete",
            ]);
          })
        ) {
          this.L.debug({ ctx, uri, msg: "recent action by engine, ignoring" });
          return;
        }

        try {
          await this.engine.delete(fname, { metaOnly: true });
        } catch (err) {
          this.L.error({ ctx, err: JSON.stringify(err) });
        }
      }, this)
    );
  }

  async changeWorkspace(rootDirRaw: string, opts?: { skipOpenWS?: boolean }) {
    opts = _.defaults(opts, { skipOpenWS: false });
    const ctx = "changeWorkspace";
    this.L.info({ ctx, rootDirRaw });
    const rootDir = resolvePath(
      rootDirRaw
    );
    if (!fs.existsSync(rootDir)) {
      throw Error(`${rootDir} does not exist`);
    }
    if (!fs.existsSync(posix.join(rootDir, DENDRON_WS_NAME))) {
      WorkspaceConfig.write(rootDir, { rootVault: "." });
    }
    Extensions.update(rootDir);
    if (!opts.skipOpenWS) {
      VSCodeUtils.openWS(posix.join(rootDir, DENDRON_WS_NAME));
    }
  }

  /**
   * Performs a series of step to initialize the workspace
   *  Calls activate workspace
   * - initializes DendronEngine
   * @param mainVault
   */
  async reloadWorkspace(mainVault?: string) {
    // TODO: dispose of existing workspace
    await this.activateWorkspace();
    if (!mainVault) {
      const wsFolders = DendronWorkspace.workspaceFolders();
      mainVault = wsFolders![0].uri.fsPath;
    }
    try {
      this._engine = await vscode.commands.executeCommand(
        DENDRON_COMMANDS.RELOAD_INDEX,
        true
      );
      return;
    } catch (err) {
      vscode.window.showErrorMessage(
        `error initializing dendron: ${JSON.stringify(err)}`
      );
    }
  }

  /**
   * Initialize a new directory with dendron files
   * @param rootDirRaw
   * @param opts
   */
  async setupWorkspace(rootDirRaw: string, opts?: { skipOpenWS?: boolean }) {
    opts = _.defaults(opts, { skipOpenWS: false });
    const ctx = "setupWorkspace";
    this.L.info({ ctx, rootDirRaw });
    const rootDir = resolvePath(
      rootDirRaw,
      DendronWorkspace.workspaceFile().fsPath
    );
    if (fs.existsSync(rootDir)) {
      const options = {
        delete: { msg: "delete existing folder", alias: "d" },
        abort: { msg: "abort current operation", alias: "a" },
        continue: {
          msg: "initialize workspace into current folder",
          alias: "c",
        },
      };
      const resp = await vscode.window.showInputBox({
        prompt: `${rootDir} exists. Please specify the next action. Your options: ${_.map(
          options,
          (v, k) => {
            return `(${k}: ${v.msg})`;
          }
        ).join(", ")}`,
        ignoreFocusOut: true,
        value: "continue",
        validateInput: async (value: string) => {
          if (!_.includes(_.keys(options), value.toLowerCase())) {
            return `not valid input. valid inputs: ${_.keys(options).join(
              ", "
            )}`;
          }
          return null;
        },
      });
      if (resp === "abort") {
        vscode.window.showInformationMessage(
          "did not initialize dendron workspace"
        );
        return;
      } else if (resp === "delete") {
        try {
          fs.removeSync(rootDir);
        } catch (err) {
          Logger.error(JSON.stringify(err));
          vscode.window.showErrorMessage(
            `error removing ${rootDir}. please check that it's not currently open`
          );
          return;
        }
        vscode.window.showInformationMessage(`removed ${rootDir}`);
      }
    }
    [rootDir].forEach((dirPath: string) => {
      fs.ensureDirSync(dirPath);
    });
    const src = vscode.Uri.joinPath(this.extensionAssetsDir, "notes");

    fs.copySync(src.fsPath, rootDir);
    WorkspaceConfig.write(rootDir);

    // writeWSFile(vscode.Uri.file(posix.join(rootDir, DENDRON_WS_NAME)).fsPath, {
    //   rootDir,
    // });
    // Extensions.update(rootDir);

    if (!opts.skipOpenWS) {
      vscode.window.showInformationMessage("opening dendron workspace");
      return VSCodeUtils.openWS(
        vscode.Uri.file(posix.join(rootDir, DENDRON_WS_NAME)).fsPath
      );
    }
  }

  async showWelcome(welcomeUri?: vscode.Uri, opts?: { reuseWindow?: boolean }) {
    welcomeUri =
      welcomeUri ||
      vscode.Uri.file(posix.join(this.rootDir, "vault.main", "dendron.md"));
    try {
      await vscode.window.showTextDocument(welcomeUri);
      await MarkdownUtils.openPreview(opts);
    } catch (err) {
      vscode.window.showErrorMessage(JSON.stringify(err));
    }
  }
}

class MarkdownUtils {
  static async openPreview(opts?: { reuseWindow?: boolean }) {
    const cleanOpts = _.defaults(opts, { reuseWindow: false });
    let previewEnhanced = vscode.extensions.getExtension(
      "shd101wyy.markdown-preview-enhanced"
    );
    let previewEnhanced2 = vscode.extensions.getExtension(
      "dendron.dendron-markdown-preview-enhanced"
    );
    const cmds = {
      builtin: {
        open: "markdown.showPreview",
        openSide: "markdown.showPreviewToSide",
      },
      enhanced: {
        open: "markdown-preview-enhanced.openPreview",
        openSide: "markdown-preview-enhanced.openPreviewToTheSide",
      },
    };
    const mdClient =
      cmds[previewEnhanced || previewEnhanced2 ? "enhanced" : "builtin"];
    const openCmd = mdClient[cleanOpts.reuseWindow ? "open" : "openSide"];
    return vscode.commands.executeCommand(openCmd);
  }
}
