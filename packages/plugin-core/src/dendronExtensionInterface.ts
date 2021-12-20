import { IDendronTreeViewV2 } from "./views/DendronTreeViewV2Interface";
import { IFileWatcher } from "./fileWatcherInterface";
import { WorkspaceService } from "@dendronhq/engine-server";
import vscode from "vscode";
import {
  DWorkspaceV2,
  WorkspaceSettings,
  WorkspaceType,
} from "@dendronhq/common-all";
import { EngineAPIService } from "./services/EngineAPIService";
import { IWorkspaceWatcher } from "./WorkspaceWatcherInterface";
import { DendronWorkspaceSettings } from "./types";
import { IDendronTreeView } from "./views/DendronTreeViewInterface";
import { IVaultsResolver } from "./utils/VaultsResolverInterface";
import { ISchemaSyncService } from "./services/SchemaSyncServiceInterface";
import { IBacklinksTreeDataProvider } from "./features/BacklinksTreeDataProviderInterface";
import { IWindowWatcher } from "./windowWatcherInterface";
import { INoteSyncService } from "./services/NoteSyncServiceInterface";
import { IWSUtilsV2 } from "./WSUtilsV2Interface";

export interface IDendronExtension {
  backlinksDataProvider: IBacklinksTreeDataProvider | undefined;
  dendronTreeView: IDendronTreeView | undefined;
  dendronTreeViewV2: IDendronTreeViewV2 | undefined;
  fileWatcher?: IFileWatcher;
  port?: number;
  workspaceService?: WorkspaceService;
  context: vscode.ExtensionContext;
  windowWatcher?: IWindowWatcher;
  workspaceWatcher?: IWorkspaceWatcher;
  serverWatcher?: vscode.FileSystemWatcher;
  type: WorkspaceType;
  workspaceImpl?: DWorkspaceV2;
  vaultsResolver: IVaultsResolver;
  schemaSyncService: ISchemaSyncService;
  noteSyncService: INoteSyncService;
  wsUtils: IWSUtilsV2;

  pauseWatchers<T = void>(cb: () => Promise<T>): Promise<T>;

  getClientAPIRootUrl(): Promise<string>;

  /** Shorthand for previously existing function getWorkspaceImplOrThrow() */
  getDWorkspace(): DWorkspaceV2;

  getWorkspaceImplOrThrow(): DWorkspaceV2;

  /** For Native workspaces (without .code-workspace file) this will return undefined. */
  getWorkspaceSettings(): Promise<WorkspaceSettings | undefined>;

  getWorkspaceSettingsSync(): WorkspaceSettings | undefined;

  getDendronWorkspaceSettingsSync(): DendronWorkspaceSettings | undefined;

  getWorkspaceSettingOrDefault({
    wsConfigKey,
    dendronConfigKey,
  }: {
    wsConfigKey: keyof DendronWorkspaceSettings;
    dendronConfigKey: string;
  }): any;

  getEngine(): EngineAPIService;

  setEngine(engine: EngineAPIService): void;

  setupViews(context: vscode.ExtensionContext): Promise<void>;

  addDisposable(disposable: vscode.Disposable): void;

  /**
   * - get workspace config and workspace folder
   * - activate workspacespace watchers
   */
  activateWatchers(): Promise<void>;

  deactivate(): Promise<void>;

  isActiveV2(_context?: vscode.ExtensionContext): boolean;
}
