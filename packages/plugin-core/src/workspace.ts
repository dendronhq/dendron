import {
  APIUtils,
  ConfigUtils,
  CONSTANTS,
  DendronError,
  DendronTreeViewKey,
  DWorkspaceV2,
  ERROR_STATUS,
  getStage,
  ResponseUtil,
  VaultUtils,
  WorkspaceSettings,
  WorkspaceType,
} from "@dendronhq/common-all";
import {
  readJSONWithComments,
  readJSONWithCommentsSync,
  resolvePath,
  writeJSONWithComments,
} from "@dendronhq/common-server";
import {
  HistoryService,
  WorkspaceService,
  WorkspaceUtils,
} from "@dendronhq/engine-server";
import { PodUtils } from "@dendronhq/pods-core";
import * as Sentry from "@sentry/node";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { Uri } from "vscode";
import { CommandFactory } from "./commandFactory";
import { ICommandFactory } from "./commandFactoryInterface";
import { PreviewPanelFactory } from "./components/views/PreviewViewFactory";
import { DendronContext, GLOBAL_STATE } from "./constants";
import {
  DendronWorkspaceSettings,
  IDendronExtension,
} from "./dendronExtensionInterface";
import { ExtensionProvider } from "./ExtensionProvider";
import BacklinksTreeDataProvider, {
  Backlink,
  secondLevelRefsToBacklinks,
} from "./features/BacklinksTreeDataProvider";
import { FileWatcher } from "./fileWatcher";
import { Logger } from "./logger";
import { CommandRegistrar } from "./services/CommandRegistrar";
import { EngineAPIService } from "./services/EngineAPIService";
import {
  NoteTraitManager,
  NoteTraitService,
} from "./services/NoteTraitService";
import { UserDefinedTraitV1 } from "./traits/UserDefinedTraitV1";
import { CodeConfigKeys } from "./types";
import { DisposableStore } from "./utils";
import { sentryReportingCallback } from "./utils/analytics";
import { VersionProvider } from "./versionProvider";
import { CalendarView } from "./views/CalendarView";
import { DendronTreeView } from "./views/DendronTreeView";
import { DendronTreeViewV2 } from "./views/DendronTreeViewV2";
import { SampleView } from "./views/SampleView";
import { VSCodeUtils } from "./vsCodeUtils";
import { WindowWatcher } from "./windowWatcher";
import { WorkspaceWatcher } from "./WorkspaceWatcher";
import { WSUtilsV2 } from "./WSUtilsV2";
import { IWSUtilsV2 } from "./WSUtilsV2Interface";

let _DendronWorkspace: DendronExtension | null;

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

/**
 * @deprecated: If need static access use ExtensionProvider.getDWorkspace().
 * Or preferably pass IDendronExtension to constructors of your classes. */
export function getDWorkspace(): DWorkspaceV2 {
  const ws = getExtension();
  return ws.getWorkspaceImplOrThrow();
}

/**
 * @deprecated: If need static access use ExtensionProvider.getExtension().
 * Or preferably pass IDendronExtension to constructors of your classes.
 * */
export function getExtension(): DendronExtension {
  return DendronExtension.instanceV2();
}

/**
 * @deprecated: If need static access use ExtensionProvider.getEngine().
 * Or preferably pass IDendronExtension to constructors of your classes.*/
export function getEngine() {
  return getExtension().getEngine();
}

export function resolveRelToWSRoot(fpath: string): string {
  return resolvePath(fpath, getDWorkspace().wsRoot as string);
}

/** Given file uri that is within a vault within the current workspace returns the vault. */
export function getVaultFromUri(fileUri: Uri) {
  const { vaults } = getDWorkspace();
  const vault = VaultUtils.getVaultByFilePath({
    fsPath: fileUri.fsPath,
    vaults,
    wsRoot: getDWorkspace().wsRoot,
  });
  return vault;
}

export const NO_WORKSPACE_IMPLEMENTATION = "no workspace implementation";

// --- Main
export class DendronExtension implements IDendronExtension {
  static DENDRON_WORKSPACE_FILE: string = "dendron.code-workspace";
  static _SERVER_CONFIGURATION: Partial<ServerConfiguration>;

  private _engine?: EngineAPIService;
  private _disposableStore: DisposableStore;
  private _traitRegistrar: NoteTraitService;
  private L: typeof Logger;
  private treeViews: { [key: string]: vscode.WebviewViewProvider };

  public backlinksDataProvider: BacklinksTreeDataProvider | undefined;
  public dendronTreeView: DendronTreeView | undefined;
  public dendronTreeViewV2: DendronTreeViewV2 | undefined;
  public fileWatcher?: FileWatcher;
  public port?: number;
  public workspaceService?: WorkspaceService;

  public context: vscode.ExtensionContext;
  public windowWatcher?: WindowWatcher;
  public workspaceWatcher?: WorkspaceWatcher;
  public serverWatcher?: vscode.FileSystemWatcher;
  public type: WorkspaceType;
  public workspaceImpl?: DWorkspaceV2;
  public wsUtils: IWSUtilsV2;
  public commandFactory: ICommandFactory;

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

  get traitRegistrar(): NoteTraitService {
    return this._traitRegistrar;
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

  static async workspaceRoots(): Promise<string[]> {
    try {
      return [path.dirname(this.workspaceFile().fsPath)];
    } catch {
      const workspaceFolders = this.workspaceFolders();
      if (workspaceFolders)
        return WorkspaceUtils.findWSRootsInWorkspaceFolders(workspaceFolders);
    }
    return [];
  }

  /** Checks if the current workspace open in VSCode is a Dendron workspace or not. */
  static async isDendronWorkspace(): Promise<boolean | undefined> {
    // we do a try catch because `DendronWorkspace.workspaceFile` throws an error if workspace file doesn't exist
    try {
      // code workspace takes precedence, if code workspace, return
      if (
        vscode.workspace.workspaceFile &&
        path.basename(DendronExtension.workspaceFile().fsPath) ===
          this.DENDRON_WORKSPACE_FILE
      )
        return true;

      const workspaceFolders = DendronExtension.workspaceFolders();
      if (workspaceFolders) {
        return !_.isEmpty(
          await WorkspaceUtils.findWSRootsInWorkspaceFolders(workspaceFolders)
        );
      }

      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * Checks if a Dendron workspace is currently active.
   */
  static isActive(_context?: vscode.ExtensionContext): boolean {
    const ctx = "DendronExtension.isActive";
    try {
      //
      const { wsRoot } = getDWorkspace();
      if (fs.existsSync(path.join(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE))) {
        return true;
      }
    } catch (err: any) {
      // If no workspace implementation is available, then workspace is not active
      if (err?.payload === NO_WORKSPACE_IMPLEMENTATION) return false;
      // Otherwise, that's an unexpected error and we should capture that
      const error =
        err instanceof DendronError
          ? err
          : new DendronError({ message: ctx, payload: err });
      Sentry.captureException(error);
      Logger.error({ ctx, msg: "Failed to check WS active", error });
      return false;
    }
    return false;
  }

  /**
   * When in dev mode, version is equivalent to `package.json` that is checked out locally
   * Otherwise, get from published extension `package.json`
   */
  static version(): string {
    return VersionProvider.version();
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

  static async getOrCreate(
    context: vscode.ExtensionContext,
    opts?: { skipSetup?: boolean }
  ): Promise<DendronExtension> {
    if (!_DendronWorkspace) {
      _DendronWorkspace = new DendronExtension(context, opts);
      _DendronWorkspace.type = await WorkspaceUtils.getWorkspaceType({
        workspaceFile: vscode.workspace.workspaceFile,
        workspaceFolders: vscode.workspace.workspaceFolders,
      });

      ExtensionProvider.register(_DendronWorkspace);
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
    _DendronWorkspace = this;
    this.L = Logger;
    this._disposableStore = new DisposableStore();
    this.treeViews = {};
    this.setupViews(context);
    this._traitRegistrar = new NoteTraitManager(new CommandRegistrar(context));
    this.wsUtils = new WSUtilsV2(this);
    this.commandFactory = new CommandFactory(this);

    const ctx = "DendronExtension";
    this.L.info({ ctx, msg: "initialized" });
  }

  getDWorkspace(): DWorkspaceV2 {
    return this.getWorkspaceImplOrThrow();
  }

  getWorkspaceImplOrThrow(): DWorkspaceV2 {
    if (_.isUndefined(this.workspaceImpl)) {
      throw new DendronError({
        message: "no native workspace",
        payload: NO_WORKSPACE_IMPLEMENTATION,
      });
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
      _.get(ConfigUtils.genDefaultConfig(), dendronConfigKey)
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

  getEngine(): EngineAPIService {
    if (!this._engine) {
      throw Error("engine not set");
    }
    return this._engine;
  }

  setEngine(engine: EngineAPIService) {
    this._engine = engine;
    this.getWorkspaceImplOrThrow().engine = engine;
  }

  async setupViews(context: vscode.ExtensionContext) {
    const ctx = "setupViews";
    HistoryService.instance().subscribe("extension", async (event) => {
      if (event.action === "initialized") {
        Logger.info({ ctx, msg: "init:treeViewV2" });
        const provider = new DendronTreeViewV2();
        const sampleView = new SampleView();

        this.treeViews[DendronTreeViewKey.SAMPLE_VIEW] = sampleView;

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

  async setupTraits() {
    // Register any User Defined Note Traits
    const userTraitsPath = getDWorkspace().wsRoot
      ? path.join(
          getDWorkspace().wsRoot,
          CONSTANTS.DENDRON_USER_NOTE_TRAITS_BASE
        )
      : undefined;

    if (userTraitsPath && fs.pathExistsSync(userTraitsPath)) {
      const files = fs.readdirSync(userTraitsPath);
      files.forEach((file) => {
        if (file.endsWith(".js")) {
          const traitId = path.basename(file, ".js");
          this.L.info("Registering User Defined Note Trait with ID " + traitId);
          const newNoteTrait = new UserDefinedTraitV1(
            traitId,
            path.join(userTraitsPath, file)
          );
          const resp = this._traitRegistrar.registerTrait(newNoteTrait);
          if (ResponseUtil.hasError(resp)) {
            this.L.error({
              msg: `Error registering trait for trait definition at ${file}`,
            });
          }
        }
      });
    }
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
    getExtension().backlinksDataProvider = backlinksTreeDataProvider;

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

  addDisposable(disposable: vscode.Disposable) {
    // handle all disposables
    this._disposableStore.add(disposable);
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

    const windowWatcher = new WindowWatcher(
      PreviewPanelFactory.getProxy(getExtension())
    );

    windowWatcher.activate(this.context);
    for (const editor of vscode.window.visibleTextEditors) {
      windowWatcher.triggerUpdateDecorations(editor);
    }
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
    const realVaults = getDWorkspace().vaults;
    const fileWatcher = new FileWatcher({
      wsRoot,
      vaults: realVaults,
    });

    fileWatcher.activate(getExtension().context);
    this.fileWatcher = fileWatcher;
  }

  async deactivate() {
    const ctx = "deactivateWorkspace";
    this.L.info({ ctx });
    this._disposableStore.dispose();
  }
}
