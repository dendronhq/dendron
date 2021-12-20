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
import { PreviewPanelFactory } from "./components/views/PreviewViewFactory";
import {
  DendronContext,
  extensionQualifiedId,
  GLOBAL_STATE,
} from "./constants";
import BacklinksTreeDataProvider, {
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
import {
  CodeConfigKeys,
  DendronWorkspaceSettings,
  WorkspaceOptsV2,
} from "./types";
import { DisposableStore, resolvePath } from "./utils";
import { sentryReportingCallback } from "./utils/analytics";
import { CalendarView } from "./views/CalendarView";
import { DendronTreeView } from "./views/DendronTreeView";
import { DendronTreeViewV2 } from "./views/DendronTreeViewV2";
import { SampleView } from "./views/SampleView";
import { VSCodeUtils } from "./vsCodeUtils";
import { WindowWatcher } from "./windowWatcher";
import { WorkspaceWatcher } from "./WorkspaceWatcher";
import { IDendronExtension } from "./dendronExtensionInterface";
import { VaultsResolver } from "./utils/VaultsResolver";
import { IVaultsResolver } from "./utils/VaultsResolverInterface";
import { ISchemaSyncService } from "./services/SchemaSyncServiceInterface";
import { SchemaSyncService } from "./services/SchemaSyncService";
import { Backlink } from "./features/Backlink";
import { IBacklinksTreeDataProvider } from "./features/BacklinksTreeDataProviderInterface";
import { INoteSyncService } from "./services/NoteSyncServiceInterface";
import { NoteSyncService } from "./services/NoteSyncService";
import { IWSUtilsV2 } from "./WSUtilsV2Interface";
import { WSUtilsV2 } from "./WSUtilsV2";

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

/** Given file uri that is within a vault within the current workspace returns the vault.
 *
 *  Note: Prefer to use an instance of VaultsResolver instead of this function.*/
export function getVaultFromUri(fileUri: Uri) {
  const vaultsResolver = new VaultsResolver(getExtension());
  return vaultsResolver.getVaultFromUri(fileUri);
}

export const NO_WORKSPACE_IMPLEMENTATION = "no workspace implementation";

// --- Main
export class DendronExtension implements IDendronExtension {
  static DENDRON_WORKSPACE_FILE: string = "dendron.code-workspace";
  static _SERVER_CONFIGURATION: Partial<ServerConfiguration>;

  private _engine?: EngineAPIService;
  private _disposableStore: DisposableStore;
  private readonly _traitRegistrar: NoteTraitService;
  private L: typeof Logger;
  private readonly treeViews: { [key: string]: vscode.WebviewViewProvider };

  public backlinksDataProvider: IBacklinksTreeDataProvider | undefined;
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
  public vaultsResolver: IVaultsResolver;
  public schemaSyncService: ISchemaSyncService;
  public noteSyncService: INoteSyncService;
  public wsUtils: IWSUtilsV2;

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

  isActiveV2(_context?: vscode.ExtensionContext): boolean {
    return DendronExtension.isActive(_context);
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

  static async getOrCreate(
    context: vscode.ExtensionContext,
    opts?: { skipSetup?: boolean }
  ) {
    if (!_DendronWorkspace) {
      _DendronWorkspace = new DendronExtension(context, opts);
      _DendronWorkspace.type = await WorkspaceUtils.getWorkspaceType({
        workspaceFile: vscode.workspace.workspaceFile,
        workspaceFolders: vscode.workspace.workspaceFolders,
      });
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

    const ctx = "DendronExtension";
    this.L.info({ ctx, msg: "initialized" });

    this.vaultsResolver = new VaultsResolver(this);
    this.schemaSyncService = new SchemaSyncService(this);
    this.noteSyncService = new NoteSyncService(this);
    this.wsUtils = new WSUtilsV2(this);
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
        const provider = new DendronTreeViewV2(this);
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
      PreviewPanelFactory.getProxy(),
      this
    );

    windowWatcher.activate(this.context);
    for (const editor of vscode.window.visibleTextEditors) {
      windowWatcher.triggerUpdateDecorations(editor);
    }
    this.windowWatcher = windowWatcher;
    const realVaults = getDWorkspace().vaults;
    const extension: IDendronExtension = this;
    const optsV2: WorkspaceOptsV2 = {
      wsRoot,
      vaults: realVaults,
      extension,
    };

    const fileWatcher = new FileWatcher(optsV2);
    this.fileWatcher = fileWatcher;

    const workspaceWatcher = new WorkspaceWatcher(extension);
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

    fileWatcher.activate(getExtension().context);
  }

  async deactivate() {
    const ctx = "deactivateWorkspace";
    this.L.info({ ctx });
    this._disposableStore.dispose();
  }
}
