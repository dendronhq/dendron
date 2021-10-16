import {
  APIUtils,
  DendronError,
  DendronTreeViewKey,
  DendronWebViewKey,
  DWorkspaceV2,
  ERROR_STATUS,
  getStage,
  WorkspaceSettings,
  WorkspaceType,
} from "@dendronhq/common-all";
import {
  NodeJSUtils,
  readJSONWithComments,
  readJSONWithCommentsSync,
  writeJSONWithComments,
} from "@dendronhq/common-server";
import {
  DConfig,
  HistoryService,
  WorkspaceService,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import { PodUtils } from "@dendronhq/pods-core";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { ALL_COMMANDS } from "./commands";
import { GoToSiblingCommand } from "./commands/GoToSiblingCommand";
import { MoveNoteCommand } from "./commands/MoveNoteCommand";
import { ReloadIndexCommand } from "./commands/ReloadIndex";
import {
  DendronContext,
  DENDRON_COMMANDS,
  extensionQualifiedId,
  GLOBAL_STATE,
} from "./constants";
import BacklinksTreeDataProvider, {
  Backlink,
  secondLevelRefsToBacklinks,
} from "./features/BacklinksTreeDataProvider";
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
import { sentryReportingCallback } from "./utils/analytics";
import { CalendarView } from "./views/CalendarView";
import { DendronTreeView } from "./views/DendronTreeView";
import { DendronTreeViewV2 } from "./views/DendronTreeViewV2";
import { SampleView } from "./views/SampleView";
import { SchemaWatcher } from "./watchers/schemaWatcher";
import { WindowWatcher } from "./windowWatcher";
import { WorkspaceWatcher } from "./WorkspaceWatcher";

let _DendronWorkspace: DendronExtension | null;

type DendronWorkspaceSettings = Partial<{
  "dendron.dailyJournalDomain": string;
  "dendron.defaultJournalName": string;
  "dendron.defaultJournalDateFormat": string;
  "dendron.defaultJournalAddBehavior": string;
  "dendron.defaultScratchName": string;
  "dendron.defaultScratchDateFormat": string;
  "dendron.defaultScratchAddBehavior": string;
  "dendron.copyNoteUrlRoot": string;
  "dendron.linkSelectAutoTitleBehavior": string;
  "dendron.defaultLookupCreateBehavior": string;
  "dendron.defaultTimestampDecorationFormat": string;
  "dendron.rootDir": string;
  "dendron.dendronDir": string;
  "dendron.logLevel": string;
  "dendron.trace.server": string;
  "dendron.serverPort": string;
}>;

export type ServerConfiguration = {
  serverPort: string;
};

export function whenGlobalState(key: string, cb?: () => boolean): boolean {
  cb =
    cb ||
    function alwaysTrue() {
      return true;
    };
  // @ts-ignore
  const out = getExtension().getGlobalState(key);
  if (!(out === false || _.isUndefined(out))) {
    return cb();
  }
  return false;
}

/**
 * Get VSCode config or Dendron Config
 */
export function getConfigValue(key: CodeConfigKeys) {
  return DendronExtension.configuration().get(key);
}

/**
 @deprecated: use `getConfigValue`
 */
export function getCodeConfig<T>(key: string): T | undefined {
  return DendronExtension.configuration().get<T>(key);
}

export function getDWorkspace(): DWorkspaceV2 {
  const ws = getExtension();
  return ws.getWorkspaceImplOrThrow();
}

export function getExtension(): DendronExtension {
  return DendronExtension.instanceV2();
}

export function getEngine() {
  return getExtension().getEngine();
}

export function resolveRelToWSRoot(fpath: string): string {
  return resolvePath(fpath, getDWorkspace().wsRoot as string);
}

// --- Main
export class DendronExtension {
  static DENDRON_WORKSPACE_FILE: string = "dendron.code-workspace";
  static _SERVER_CONFIGURATION: Partial<ServerConfiguration>;

  public dendronTreeView: DendronTreeView | undefined;
  public dendronTreeViewV2: DendronTreeViewV2 | undefined;
  public fileWatcher?: FileWatcher;
  public port?: number;
  public workspaceService?: WorkspaceService;
  protected treeViews: { [key: string]: vscode.WebviewViewProvider };
  protected webViews: { [key: string]: vscode.WebviewPanel | undefined };

  static context(): vscode.ExtensionContext {
    return getExtension().context;
  }

  static instanceV2(): DendronExtension {
    if (!_DendronWorkspace) {
      throw Error("Dendronworkspace not initialized");
    }
    return _DendronWorkspace;
  }

  static serverConfiguration() {
    if (!DendronExtension._SERVER_CONFIGURATION) {
      DendronExtension._SERVER_CONFIGURATION = {};
    }
    return DendronExtension._SERVER_CONFIGURATION as ServerConfiguration;
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
      Logger.error({ ctx, error: err as DendronError });
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

  async getClientAPIRootUrl() {
    const port = this.port;
    if (!port) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.ENGINE_NOT_SET,
      });
    }
    // asExternalUri forwards the port when working remotely
    const externalUri = await vscode.env.asExternalUri(
      vscode.Uri.parse(APIUtils.getLocalEndpoint(port))
    );
    const uri = externalUri.toString();
    return uri;
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

  static workspaceRoot(): string | undefined {
    try {
      return path.dirname(this.workspaceFile().fsPath);
    } catch {
      const workspaceFolders = this.workspaceFolders();
      if (workspaceFolders)
        return WorkspaceUtils.findWSRootInWorkspaceFolders(workspaceFolders)
          ?.uri.fsPath;
    }
    return undefined;
  }

  /**
   * Currently, this is a check to see if rootDir is defined in settings
   */
  static isActive(context?: vscode.ExtensionContext) {
    /**
     * we do a try catch because `DendronWorkspace.workspaceFile` throws an error if workspace file doesn't exist
     * the reason we don't use `vscode.*` method is because we need to stub this value during tests
     */
    try {
      // code workspace takes precedence, if code workspace, return
      const hasCodeWorkspaceFiile =
        vscode.workspace.workspaceFile &&
        path.basename(DendronExtension.workspaceFile().fsPath) ===
          this.DENDRON_WORKSPACE_FILE;
      if (hasCodeWorkspaceFiile) {
        return hasCodeWorkspaceFiile;
      }

      const workspaceFolders = DendronExtension.workspaceFolders();
      if (context && workspaceFolders) {
        return WorkspaceUtils.findWSRootInWorkspaceFolders(workspaceFolders);
      }
      return hasCodeWorkspaceFiile;
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
  public serverWatcher?: vscode.FileSystemWatcher;
  public schemaWatcher?: SchemaWatcher;
  public L: typeof Logger;
  public _enginev2?: EngineAPIService;
  public type: WorkspaceType;
  private disposableStore: DisposableStore;
  public workspaceImpl?: DWorkspaceV2;

  static getOrCreate(
    context: vscode.ExtensionContext,
    opts?: { skipSetup?: boolean }
  ) {
    if (!_DendronWorkspace) {
      _DendronWorkspace = new DendronExtension(context, opts);
    }
    return _DendronWorkspace;
  }

  static async updateWorkspaceFile(opts: {
    updateCb: (settings: WorkspaceSettings) => WorkspaceSettings;
  }) {
    const { updateCb } = opts;
    const wsPath = DendronExtension.workspaceFile().fsPath;
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
    // set the default
    this.type = WorkspaceType.CODE;
    this.type = WorkspaceUtils.getWorkspaceType({
      workspaceFile: vscode.workspace.workspaceFile,
      workspaceFolders: vscode.workspace.workspaceFolders,
    });
    _DendronWorkspace = this;
    this.L = Logger;
    this.disposableStore = new DisposableStore();
    this._setupCommands();
    this.setupLanguageFeatures(context);
    this.treeViews = {};
    this.webViews = {};
    this.setupViews(context);
    const ctx = "DendronExtension";
    this.L.info({ ctx, msg: "initialized" });
  }

  getWorkspaceImplOrThrow(): DWorkspaceV2 {
    if (_.isUndefined(this.workspaceImpl)) {
      throw Error("no native workspace");
    }
    return this.workspaceImpl;
  }

  /** For Native workspaces (without .code-workspace file) this will return undefined. */
  async getWorkspaceSettings(): Promise<WorkspaceSettings | undefined> {
    let workspaceFile: vscode.Uri;
    try {
      workspaceFile = DendronExtension.workspaceFile();
      if (workspaceFile === undefined) return undefined;
    } catch {
      // No workspace file exists (or some other disk issue)
      return undefined;
    }
    return (await readJSONWithComments(
      workspaceFile.fsPath
    )) as WorkspaceSettings;
  }

  getWorkspaceSettingsSync(): WorkspaceSettings | undefined {
    let workspaceFile: vscode.Uri;
    try {
      workspaceFile = DendronExtension.workspaceFile();
    } catch {
      // No workspace file exists (or some other disk issue)
      return undefined;
    }
    return readJSONWithCommentsSync(workspaceFile.fsPath) as WorkspaceSettings;
  }

  getDendronWorkspaceSettingsSync(): DendronWorkspaceSettings | undefined {
    const settings = this.getWorkspaceSettingsSync()?.settings;
    return settings;
  }

  getWorkspaceSettingOrDefault({
    wsConfigKey,
    dendronConfigKey,
  }: {
    wsConfigKey: keyof DendronWorkspaceSettings;
    dendronConfigKey: string;
  }) {
    const config = getDWorkspace().config;
    // user already using new value
    if (_.get(config, dendronConfigKey)) {
      return _.get(config, dendronConfigKey);
    }
    // migrate value from workspace setting. if not exist, migrate from new default
    const out = _.get(
      this.getDendronWorkspaceSettingsSync(),
      wsConfigKey,
      _.get(DConfig.genDefaultConfig(), dendronConfigKey)
    );
    // this should not happen
    if (_.isUndefined(out)) {
      throw new DendronError({
        message: `no config key found. workspace: ${wsConfigKey}, dendron.yml: ${dendronConfigKey}`,
      });
    }
    return out;
  }

  get podsDir(): string {
    const rootDir = getDWorkspace().wsRoot;
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
    const wsFolders = DendronExtension.workspaceFolders();
    if (_.isEmpty(wsFolders) || _.isUndefined(wsFolders)) {
      throw Error("no ws folders");
    }
    return wsFolders[0] as vscode.WorkspaceFolder;
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
    this.getWorkspaceImplOrThrow().engine = engine;
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

        const calendarView = new CalendarView();
        context.subscriptions.push(
          vscode.window.registerWebviewViewProvider(
            CalendarView.viewType,
            calendarView
          )
        );

        if (getDWorkspace().config.dev?.enableWebUI) {
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
          VSCodeUtils.setContext(DendronContext.WEB_UI_ENABLED, true);
        }

        // backlinks
        const backlinkTreeView = this.setupBacklinkTreeView();

        // This persists even if getChildren populates the view.
        // Removing it for now.
        // backlinkTreeView.message = "There are no links to this note."
        context.subscriptions.push(backlinkTreeView);
      }
    });
  }

  private setupBacklinkTreeView() {
    const ctx = "setupBacklinkTreeView";
    Logger.info({ ctx, msg: "init:backlinks" });

    const backlinksTreeDataProvider = new BacklinksTreeDataProvider(
      getDWorkspace().config.dev?.enableLinkCandidates
    );
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

    vscode.commands.registerCommand(
      "dendron.backlinks.expandAll",
      sentryReportingCallback(async () => {
        function expand(backlink: Backlink) {
          backlinkTreeView.reveal(backlink, {
            expand: true,
            focus: false,
            select: false,
          });
        }

        const children = await backlinksTreeDataProvider.getChildren();
        children?.forEach((backlink) => {
          expand(backlink);

          if (backlink.refs) {
            const childBacklinks = secondLevelRefsToBacklinks(
              backlink.refs,
              backlinksTreeDataProvider.isLinkCandidateEnabled
            );

            if (childBacklinks) {
              childBacklinks.forEach((b) => {
                expand(b);
              });
            }
          }
        });
      })
    );

    return backlinkTreeView;
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
    let prevCommand: any;
    ALL_COMMANDS.map((Cmd) => {
      try {
        const cmd = new Cmd();
        prevCommand = cmd;
        this.context.subscriptions.push(
          vscode.commands.registerCommand(
            cmd.key,
            sentryReportingCallback(async (args: any) => {
              await cmd.run(args);
            })
          )
        );
      } catch (err) {
        debugger;

      }
    });

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.RELOAD_INDEX.key,
        sentryReportingCallback(async (silent?: boolean) => {
          const out = await new ReloadIndexCommand().run({ silent });
          if (!silent) {
            vscode.window.showInformationMessage(`finish reload`);
          }
          return out;
        })
      )
    );

    // ---

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.GO_NEXT_HIERARCHY.key,
        sentryReportingCallback(async () => {
          await new GoToSiblingCommand().execute({ direction: "next" });
        })
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.GO_PREV_HIERARCHY.key,
        sentryReportingCallback(async () => {
          await new GoToSiblingCommand().execute({ direction: "prev" });
        })
      )
    );

    // RENAME is alias to MOVE
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.RENAME_NOTE.key,
        sentryReportingCallback(async (args: any) => {
          await new MoveNoteCommand().run({
            allowMultiselect: false,
            useSameVault: true,
            ...args,
          });
        })
      )
    );
  }

  addDisposable(disposable: vscode.Disposable) {
    // handle all disposables
    this.disposableStore.add(disposable);
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
    const { wsRoot } = getDWorkspace();
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

    const wsFolders = DendronExtension.workspaceFolders();
    if (_.isUndefined(wsFolders) || _.isEmpty(wsFolders)) {
      this.L.error({
        ctx,
        msg: "no folders set for workspace",
      });
      throw Error("no folders set for workspace");
    }
    const vaults = wsFolders as vscode.WorkspaceFolder[];
    const realVaults = getDWorkspace().vaults;
    const fileWatcher = new FileWatcher({
      wsRoot,
      vaults: realVaults,
    });
    const schemaWatcher = new SchemaWatcher({ vaults });
    schemaWatcher.activate(this.context);
    this.schemaWatcher = schemaWatcher;

    fileWatcher.activate(getExtension().context);
    this.fileWatcher = fileWatcher;
  }

  async deactivate() {
    const ctx = "deactivateWorkspace";
    this.L.info({ ctx });
    this.disposableStore.dispose();
  }
}
