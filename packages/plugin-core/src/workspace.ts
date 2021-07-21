import {
  APIUtils,
  DendronConfig,
  DendronError,
  DendronTreeViewKey,
  DendronWebViewKey,
  DVault,
  ERROR_STATUS,
  getStage,
  ResponseCode,
  TutorialEvents,
  WorkspaceSettings
} from "@dendronhq/common-all";
import {
  NodeJSUtils,
  readJSONWithComments,
  readMD, resolveTilde, writeJSONWithComments
} from "@dendronhq/common-server";
import {
  DConfig,
  HistoryService,
  WorkspaceService
} from "@dendronhq/engine-server";
import { PodUtils } from "@dendronhq/pods-core";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { ALL_COMMANDS } from "./commands";
import { GoToSiblingCommand } from "./commands/GoToSiblingCommand";
import { LookupCommand, VaultSelectionMode } from "./commands/LookupCommand";
import { MoveNoteCommand } from "./commands/MoveNoteCommand";
import { ReloadIndexCommand } from "./commands/ReloadIndex";
import { SetupWorkspaceCommand } from "./commands/SetupWorkspace";
import {
  CONFIG,
  DendronContext,
  DENDRON_COMMANDS,
  extensionQualifiedId,
  GLOBAL_STATE
} from "./constants";
import BacklinksTreeDataProvider from "./features/BacklinksTreeDataProvider";
import { codeActionProvider } from "./features/codeActionProvider";
import { completionProvider } from "./features/completionProvider";
import DefinitionProvider from "./features/DefinitionProvider";
import FrontmatterFoldingRangeProvider from "./features/FrontmatterFoldingRangeProvider";
import ReferenceHoverProvider from "./features/ReferenceHoverProvider";
import ReferenceProvider from "./features/ReferenceProvider";
import { FileWatcher } from "./fileWatcher";
import { Logger } from "./logger";
import { EngineAPIService } from "./services/EngineAPIService";
import { CodeConfigKeys } from "./types";
import { DisposableStore, resolvePath, VSCodeUtils } from "./utils";
import { AnalyticsUtils } from "./utils/analytics";
import { CalendarView } from "./views/CalendarView";
import { DendronTreeView } from "./views/DendronTreeView";
import { DendronTreeViewV2 } from "./views/DendronTreeViewV2";
import { SampleView } from "./views/SampleView";
import { SchemaWatcher } from "./watchers/schemaWatcher";
import { WindowWatcher } from "./windowWatcher";
import { TutorialInitializer } from "./workspace/tutorialInitializer";
import { WorkspaceWatcher } from "./WorkspaceWatcher";

let _DendronWorkspace: DendronWorkspace | null;

export type ServerConfiguration = {
  serverPort: string;
};

/**
 * Check for boolean toggles
 */
export async function when<T = any>(
  key: keyof DendronConfig,
  cb: () => Promise<T>
): Promise<T | ResponseCode> {
  try {
    const out = DendronWorkspace.instance().config[key];
    if (!(out === false || _.isUndefined(out))) {
      return cb();
    }
    return ResponseCode.PRECONDITION_FAILED;
  } catch (err) {
    return err;
  }
}

export function whenGlobalState(key: string, cb?: () => boolean): boolean {
  cb =
    cb ||
    function alwaysTrue() {
      return true;
    };
  // @ts-ignore
  const out = DendronWorkspace.instance().getGlobalState(key);
  if (!(out === false || _.isUndefined(out))) {
    return cb();
  }
  return false;
}

/**
 * Get VSCode config or Dendron Config
 */
export function getConfigValue(key: CodeConfigKeys) {
  return DendronWorkspace.configuration().get(key);
}

export function getGlobalState<T>(key: GLOBAL_STATE) {
  return DendronWorkspace.instance().getGlobalState<T>(key);
}

/**
 @deprecated: use `getConfigValue`
 */
export function getCodeConfig<T>(key: string): T | undefined {
  return DendronWorkspace.configuration().get<T>(key);
}

export function getWS() {
  return DendronWorkspace.instance();
}

export function getEngine() {
  return DendronWorkspace.instance().getEngine();
}

export function resolveRelToWSRoot(fpath: string): string {
  return resolvePath(fpath, DendronWorkspace.wsRoot() as string);
}

// --- Main
export class DendronWorkspace {
  static DENDRON_WORKSPACE_FILE: string = "dendron.code-workspace";
  static _SERVER_CONFIGURATION: Partial<ServerConfiguration>;

  public dendronTreeView: DendronTreeView | undefined;
  public dendronTreeViewV2: DendronTreeViewV2 | undefined;
  public fileWatcher?: FileWatcher;
  public port?: number;
  public workspaceService?: WorkspaceService;
  protected treeViews: { [key: string]: vscode.WebviewViewProvider };
  protected webViews: { [key: string]: vscode.WebviewPanel | undefined };

  static instance(): DendronWorkspace {
    if (!_DendronWorkspace) {
      throw Error("Dendronworkspace not initialized");
    }
    return _DendronWorkspace;
  }

  static serverConfiguration() {
    if (!DendronWorkspace._SERVER_CONFIGURATION) {
      DendronWorkspace._SERVER_CONFIGURATION = {};
    }
    return DendronWorkspace._SERVER_CONFIGURATION as ServerConfiguration;
  }

  /**
   * Global Workspace configuration
   */
  static configuration(
    section?: string | undefined
  ): vscode.WorkspaceConfiguration {
    // the reason this is static is so we can stub it for tests
    return vscode.workspace.getConfiguration(section);
  }

  async pauseWatchers<T = void>(cb: () => Promise<T>) {
    const ctx = "pauseWatchers";
    if (this.fileWatcher) {
      this.fileWatcher.pause = true;
    }
    if (this.dendronTreeView) {
      this.dendronTreeView.pause = true;
    }
    try {
      const out = await cb();
      return out;
    } catch (err) {
      Logger.error({ ctx, error: err });
      throw err;
    } finally {
      if (this.fileWatcher) {
        this.fileWatcher.pause = false;
      }
      if (this.dendronTreeView) {
        this.dendronTreeView.pause = false;
      }
    }
  }

  getClientAPIRootUrl() {
    const port = this.port;
    if (!port) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.ENGINE_NOT_SET,
      });
    }
    return APIUtils.getLocalEndpoint(port);
  }

  /**
   * Full path to workspace root
   */
  static wsRoot(): string {
    const rootDir = getCodeConfig<string>(CONFIG.ROOT_DIR.key);
    const workspaceDir = path.dirname(DendronWorkspace.workspaceFile().fsPath);
    if (rootDir) {
      return resolvePath(rootDir, workspaceDir);
    }
    return workspaceDir;
  }

  static lsp(): boolean {
    return true;
  }

  /**
   * Workspace settings file
   */
  static workspaceFile(): vscode.Uri {
    if (!vscode.workspace.workspaceFile) {
      throw Error("no workspace file");
    }
    return vscode.workspace.workspaceFile;
  }

  static workspaceFolders(): readonly vscode.WorkspaceFolder[] | undefined {
    return vscode.workspace.workspaceFolders;
  }

  static rootWorkspaceFolder(): vscode.WorkspaceFolder | undefined {
    const wsFolders = DendronWorkspace.workspaceFolders();
    if (wsFolders) {
      return wsFolders[0];
    }
    return;
  }

  /**
   * Currently, this is a check to see if rootDir is defined in settings
   */
  static isActive(): boolean {
    /**
     * we do a try catch because `DendronWorkspace.workspaceFile` throws an error if workspace file doesn't exist
     * the reason we don't use `vscode.*` method is because we need to stub this value during tests
     */
    try {
      return (
        path.basename(DendronWorkspace.workspaceFile().fsPath) ===
        this.DENDRON_WORKSPACE_FILE
      );
    } catch (err) {
      return false;
    }
  }

  static version(): string {
    let version: string | undefined;
    if (VSCodeUtils.isDevMode()) {
      version = NodeJSUtils.getVersionFromPkg();
    } else {
      try {
        const dendronExtension =
          vscode.extensions.getExtension(extensionQualifiedId)!;
        version = dendronExtension.packageJSON.version;
      } catch (err) {
        version = NodeJSUtils.getVersionFromPkg();
      }
    }
    if (_.isUndefined(version)) {
      version = "0.0.0";
    }
    return version;
  }

  static async resetConfig(globalState: vscode.Memento) {
    // eslint-disable-next-line  no-return-await
    return await Promise.all(
      _.keys(GLOBAL_STATE).map((k) => {
        const _key = GLOBAL_STATE[k as keyof typeof GLOBAL_STATE];
        return globalState.update(_key, undefined);
      })
    );
  }

  public context: vscode.ExtensionContext;
  public windowWatcher?: WindowWatcher;
  public workspaceWatcher?: WorkspaceWatcher;
  public fsWatcher?: vscode.FileSystemWatcher;
  public serverWatcher?: vscode.FileSystemWatcher;
  public schemaWatcher?: SchemaWatcher;
  public L: typeof Logger;
  public _enginev2?: EngineAPIService;
  private disposableStore: DisposableStore;

  static getOrCreate(
    context: vscode.ExtensionContext,
    opts?: { skipSetup?: boolean }
  ) {
    if (!_DendronWorkspace) {
      _DendronWorkspace = new DendronWorkspace(context, opts);
    }
    return _DendronWorkspace;
  }

  static async updateWorkspaceFile(opts: {
    updateCb: (settings: WorkspaceSettings) => WorkspaceSettings;
  }) {
    const { updateCb } = opts;
    const wsPath = DendronWorkspace.workspaceFile().fsPath;
    let settings = (await readJSONWithComments(wsPath)) as WorkspaceSettings;
    settings = updateCb(settings);
    await writeJSONWithComments(wsPath, settings);
    return settings;
  }

  constructor(
    context: vscode.ExtensionContext,
    opts?: { skipSetup?: boolean }
  ) {
    opts = _.defaults(opts, { skipSetup: false });
    this.context = context;
    _DendronWorkspace = this;
    this.L = Logger;
    this.disposableStore = new DisposableStore();
    this._setupCommands();
    this.setupLanguageFeatures(context);
    this.treeViews = {};
    this.webViews = {};
    this.setupViews(context);
    const ctx = "DendronWorkspace";
    this.L.info({ ctx, msg: "initialized" });
  }

  get configRoot(): string {
    const dendronDir = getCodeConfig<string | undefined>(
      CONFIG.DENDRON_DIR.key
    );
    if (_.isEmpty(dendronDir) || _.isUndefined(dendronDir)) {
      return DendronWorkspace.wsRoot();
    } else {
      return resolveRelToWSRoot(dendronDir);
    }
  }

  /**
   * @remark: We need to get the config from disk because the engine might not be initialized yet
   */
  get config(): DendronConfig {
    const dendronRoot = getWS().configRoot;
    if (!dendronRoot) {
      throw new Error(`dendronRoot not set when get config`);
    }
    const config = DConfig.getOrCreate(dendronRoot);
    return DConfig.defaults(config);
  }

  async getWorkspaceSettings(): Promise<WorkspaceSettings> {
    return (await readJSONWithComments(
      DendronWorkspace.workspaceFile().fsPath
    )) as WorkspaceSettings;
  }

  get podsDir(): string {
    const rootDir = DendronWorkspace.wsRoot();
    if (!rootDir) {
      throw new Error(`rootdir not set when get podsDir`);
    }
    const podsPath = PodUtils.getPodDir({ wsRoot: rootDir });
    fs.ensureDirSync(podsPath);
    return podsPath;
  }

  /**
   * The first workspace folder
   */
  get rootWorkspace(): vscode.WorkspaceFolder {
    const wsFolders = DendronWorkspace.workspaceFolders();
    if (_.isEmpty(wsFolders) || _.isUndefined(wsFolders)) {
      throw Error("no ws folders");
    }
    return wsFolders[0] as vscode.WorkspaceFolder;
  }

  get extensionDir(): string {
    // return "/Users/kevinlin/.vscode-insiders/extensions/dendron.dendron-0.20.1-alpha.5"
    return path.join(this.context.extensionPath);
  }

  get extensionAssetsDir(): vscode.Uri {
    const assetsDir = vscode.Uri.file(
      path.join(this.context.extensionPath, "assets")
    );
    return assetsDir;
  }

  /**
   * Relative vaults
   */
  get vaultsv4(): DVault[] {
    const vaults = DendronWorkspace.instance().config.vaults;
    return vaults;
  }

  getTreeView(key: DendronTreeViewKey) {
    return this.treeViews[key];
  }

  setTreeView(key: DendronTreeViewKey, view: vscode.WebviewViewProvider) {
    this.treeViews[key] = view;
  }

  getWebView(key: DendronWebViewKey) {
    return this.webViews[key];
  }

  setWebView(key: DendronWebViewKey, view: vscode.WebviewPanel | undefined) {
    this.webViews[key] = view;
  }

  getEngine(): EngineAPIService {
    if (!this._enginev2) {
      throw Error("engine not set");
    }
    return this._enginev2;
  }

  setEngine(engine: EngineAPIService) {
    this._enginev2 = engine;
  }

  async setupViews(context: vscode.ExtensionContext) {
    const ctx = "setupViews";
    HistoryService.instance().subscribe("extension", async (event) => {
      if (event.action === "initialized") {
        Logger.info({ ctx, msg: "init:treeViewV2" });
        const provider = new DendronTreeViewV2();
        // TODO:
        const sampleView = new SampleView();
        context.subscriptions.push(
          vscode.window.registerWebviewViewProvider(
            SampleView.viewType,
            sampleView
          )
        );

        if (getWS().config.dev?.enableWebUI) {
          Logger.info({ ctx, msg: "initWebUI" });
          context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
              DendronTreeViewV2.viewType,
              provider,
              {
                webviewOptions: {
                  retainContextWhenHidden: true,
                },
              }
            )
          );
          const calendarView = new CalendarView();
          context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
              CalendarView.viewType,
              calendarView
            )
          );
          VSCodeUtils.setContext(DendronContext.WEB_UI_ENABLED, true);
        }

        // backlinks
        Logger.info({ ctx, msg: "init:backlinks" });
        const backlinksTreeDataProvider = new BacklinksTreeDataProvider();
        vscode.window.onDidChangeActiveTextEditor(
          // eslint-disable-next-line  no-return-await
          async () => await backlinksTreeDataProvider.refresh()
        );
        const backlinkTreeView = vscode.window.createTreeView(
          DendronTreeViewKey.BACKLINKS,
          {
            treeDataProvider: backlinksTreeDataProvider,
            showCollapseAll: true,
          }
        );
        // This persists even if getChildren populates the view.
        // Removing it for now.
        // backlinkTreeView.message = "There are no links to this note."
        context.subscriptions.push(backlinkTreeView);
      }
    });
  }

  setupLanguageFeatures(context: vscode.ExtensionContext) {
    const mdLangSelector = { language: "markdown", scheme: "*" };
    vscode.languages.registerReferenceProvider(
      mdLangSelector,
      new ReferenceProvider()
    );
    vscode.languages.registerDefinitionProvider(
      mdLangSelector,
      new DefinitionProvider()
    );
    vscode.languages.registerHoverProvider(
      mdLangSelector,
      new ReferenceHoverProvider()
    );
    vscode.languages.registerFoldingRangeProvider(
      mdLangSelector,
      new FrontmatterFoldingRangeProvider()
    );
    completionProvider.activate(context);
    codeActionProvider.activate(context);
  }

  _setupCommands() {
    ALL_COMMANDS.map((Cmd) => {
      const cmd = new Cmd();

      this.context.subscriptions.push(
        vscode.commands.registerCommand(cmd.key, async (args: any) => {
          await cmd.run(args);
        })
      );
    });

    // ----

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.LOOKUP.key,
        async (args: any) => {
          const confirmVaultSetting =
            DendronWorkspace.instance().config["lookupConfirmVaultOnCreate"];
          const selectionMode =
            confirmVaultSetting === false || _.isUndefined(confirmVaultSetting)
              ? VaultSelectionMode.smart
              : VaultSelectionMode.alwaysPrompt;
          new LookupCommand().run({
            ...args,
            flavor: "note",
            vaultSelectionMode: selectionMode,
          });
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.LOOKUP_SCHEMA.key,
        async () => {
          return new LookupCommand().run({ flavor: "schema" });
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.RELOAD_INDEX.key,
        async (silent?: boolean) => {
          const out = await new ReloadIndexCommand().run();
          if (!silent) {
            vscode.window.showInformationMessage(`finish reload`);
          }
          return out;
        }
      )
    );

    // ---

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.GO_NEXT_HIERARCHY.key,
        async () => {
          await new GoToSiblingCommand().execute({ direction: "next" });
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.GO_PREV_HIERARCHY.key,
        async () => {
          await new GoToSiblingCommand().execute({ direction: "prev" });
        }
      )
    );

    // RENAME is alias to MOVE
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.RENAME_NOTE.key,
        async (args: any) => {
          await new MoveNoteCommand().run({ useSameVault: true, ...args });
        }
      )
    );
  }

  addDisposable(disposable: vscode.Disposable) {
    // handle all disposables
    this.disposableStore.add(disposable);
  }

  // === Utils

  getGlobalState<T>(key: GLOBAL_STATE) {
    return this.context.globalState.get<T>(key);
  }

  updateGlobalState(key: GLOBAL_STATE, value: any) {
    return this.context.globalState.update(key, value);
  }

  // === Workspace
  /**
   * - get workspace config and workspace folder
   * - activate workspacespace watchers
   */
  async activateWatchers() {
    const ctx = "activateWorkspace";
    const stage = getStage();
    this.L.info({ ctx, stage, msg: "enter" });
    const wsRoot = DendronWorkspace.wsRoot();
    if (!wsRoot) {
      throw new Error(`rootDir not set when activating Watcher`);
    }

    const windowWatcher = new WindowWatcher();
    windowWatcher.activate(this.context);
    windowWatcher.triggerUpdateDecorations();
    this.windowWatcher = windowWatcher;
    const workspaceWatcher = new WorkspaceWatcher();
    workspaceWatcher.activate(this.context);
    this.workspaceWatcher = workspaceWatcher;

    const wsFolders = DendronWorkspace.workspaceFolders();
    if (_.isUndefined(wsFolders) || _.isEmpty(wsFolders)) {
      this.L.error({
        ctx,
        msg: "no folders set for workspace",
      });
      throw Error("no folders set for workspace");
    }
    const vaults = wsFolders as vscode.WorkspaceFolder[];
    const realVaults = DendronWorkspace.instance().vaultsv4;
    const fileWatcher = new FileWatcher({
      wsRoot,
      vaults: realVaults,
    });
    const schemaWatcher = new SchemaWatcher({ vaults });
    schemaWatcher.activate(this.context);
    this.schemaWatcher = schemaWatcher;

    fileWatcher.activate(DendronWorkspace.instance().context);
    this.fileWatcher = fileWatcher;
  }

  async deactivate() {
    const ctx = "deactivateWorkspace";
    this.L.info({ ctx });
    this.fsWatcher?.dispose();
    this.disposableStore.dispose();
  }

  /**
   * Performs a series of step to initialize the workspace
   *  Calls activate workspace
   * - initializes DendronEngine
   * @param mainVault
   */
  async reloadWorkspace() {
    try {
      const out = await vscode.commands.executeCommand(
        DENDRON_COMMANDS.RELOAD_INDEX.key,
        true
      );
      return out;
    } catch (err) {
      Logger.error({ error: err });
    }
  }

  async showWelcome() {
    try {
      const ws = DendronWorkspace.instance();

      // NOTE: this needs to be from extension because no workspace might exist at this point
      const uri = VSCodeUtils.joinPath(
        ws.context.extensionUri,
        "assets",
        "dendron-ws",
        "vault",
        "welcome.html"
      );

      const { content } = readMD(uri.fsPath);
      const title = "Welcome to Dendron";

      const panel = vscode.window.createWebviewPanel(
        _.kebabCase(title),
        title,
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );
      panel.webview.html = content;

      panel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case "loaded":
              AnalyticsUtils.track(TutorialEvents.WelcomeShow);
              return;

            case "initializeWorkspace": {
              // Try to put into a Default '~/Dendron' folder first. Only prompt
              // if that path and the backup path already exist to lower
              // onboarding friction
              let wsPath;
              const wsPathPrimary = path.join(resolveTilde("~"), "Dendron");
              const wsPathBackup = path.join(resolveTilde("~"), "Dendron-Tutorial");

              if (!fs.pathExistsSync(wsPathPrimary)) {
                wsPath = wsPathPrimary;
              }
              else if (!fs.pathExistsSync(wsPathBackup)) {
                wsPath = wsPathBackup;
              }

              if (!wsPath) {
                await new SetupWorkspaceCommand().run({
                  workspaceInitializer: new TutorialInitializer()
                });
              }
              else {
                await new SetupWorkspaceCommand().execute({
                  rootDirRaw: wsPath,
                  workspaceInitializer: new TutorialInitializer(),
                });
              }

              return;
            }
            default:
              break;
          }
        },
        undefined,
        undefined
      );
    } catch (err) {
      vscode.window.showErrorMessage(JSON.stringify(err));
    }
  }
}
