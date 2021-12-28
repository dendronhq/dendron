import vscode from "vscode";
import {
  DWorkspaceV2,
  WorkspaceSettings,
  WorkspaceType,
} from "@dendronhq/common-all";
import { IWSUtilsV2 } from "./WSUtilsV2Interface";
import { IWorkspaceService } from "@dendronhq/engine-server";
import { IEngineAPIService } from "./services/EngineAPIServiceInterface";
import { ICommandFactory } from "./commandFactoryInterface";
import { ISchemaSyncService } from "./services/SchemaSyncServiceInterface";

export type DendronWorkspaceSettings = Partial<{
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

/**
 * This is THE interface of DendronExtension.
 *
 * Going forward we should NOT be using DendronExtension object directly
 * (Eg. avoid using workspace.getExtension()).
 *
 * A very large amount of our application will require to take dependency on this
 * interface hence it is paramount that it is kept away from any circular dependencies
 * to accomplish that goal this interface should for the most part deal with interfaces
 * (so think thrice prior to exposing a concrete class from this interface, since
 * concrete classes tend to take on dependencies on other concrete classes).
 *
 * For most of the usage of this interface we should strive to get an instance of this
 * interface through constructor dependency injection. However, during transition
 * to constructor injection if we need to get this instance in a static fashion then
 * use ExtensionProvider class.
 * */
export interface IDendronExtension {
  port?: number;
  context: vscode.ExtensionContext;
  serverWatcher?: vscode.FileSystemWatcher;
  type: WorkspaceType;
  wsUtils: IWSUtilsV2;
  commandFactory: ICommandFactory;
  schemaSyncService: ISchemaSyncService;
  workspaceService?: IWorkspaceService;

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

  setupViews(context: vscode.ExtensionContext): Promise<void>;

  addDisposable(disposable: vscode.Disposable): void;

  getEngine(): IEngineAPIService;
}
