import {
  WorkspaceType,
  DWorkspaceV2,
  WorkspaceSettings,
  DEngineClient,
  DVault,
} from "@dendronhq/common-all";
import { IWorkspaceService } from "@dendronhq/engine-server";
import { ExtensionContext, FileSystemWatcher, Disposable } from "vscode";
import { ICommandFactory } from "../commandFactoryInterface";
import { ILookupControllerV3Factory } from "../components/lookup/LookupControllerV3Interface";
import {
  INoteLookupProviderFactory,
  ISchemaLookupProviderFactory,
} from "../components/lookup/LookupProviderV3Interface";
import { IDendronExtension } from "../dendronExtensionInterface";
import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
import { INoteSyncService } from "../services/NoteSyncService";
import { ISchemaSyncService } from "../services/SchemaSyncServiceInterface";
import { WSUtilsV2 } from "../WSUtilsV2";
import { IWSUtilsV2 } from "../WSUtilsV2Interface";

/**
 * Mock Dendron Extension for testing purposes. Right now, only getEngine() and
 * context are implemented. If you require additional functionality for your
 * tests, either add it here, or extend this class for your own testing scenario
 */
export class MockDendronExtension implements IDendronExtension {
  private _engine: DEngineClient;
  private _context: ExtensionContext;
  private _wsRoot: string;
  private _vaults: DVault[] | undefined;

  constructor(
    engine: DEngineClient,
    wsRoot: string,
    context: ExtensionContext,
    vaults?: DVault[]
  ) {
    this._engine = engine;
    this._context = context;
    this._wsRoot = wsRoot;
    this._vaults = vaults;
  }

  port?: number | undefined;
  get context(): ExtensionContext {
    return this._context;
  }

  serverWatcher?: FileSystemWatcher | undefined;

  get type(): WorkspaceType {
    throw new Error("Method not implemented");
  }
  get wsUtils(): IWSUtilsV2 {
    return new WSUtilsV2(this);
  }
  get commandFactory(): ICommandFactory {
    throw new Error("Method not implemented");
  }
  get schemaSyncService(): ISchemaSyncService {
    throw new Error("Method not implemented");
  }
  get workspaceService(): IWorkspaceService | undefined {
    throw new Error("Method not implemented");
  }
  get noteSyncService(): INoteSyncService {
    throw new Error("Method not implemented");
  }
  get lookupControllerFactory(): ILookupControllerV3Factory {
    throw new Error("Method not implemented");
  }
  get noteLookupProviderFactory(): INoteLookupProviderFactory {
    throw new Error("Method not implemented");
  }
  // schemaLookupProviderFactory: ISchemaLookupProviderFactory;

  get schemaLookupProviderFactory(): ISchemaLookupProviderFactory {
    throw new Error("Method not implemented.");
  }

  /**
   * Note: No-Op
   * @param _cb
   * @returns
   */
  pauseWatchers<T = void>(cb: () => Promise<T>): Promise<T> {
    return cb();
  }

  getClientAPIRootUrl(): Promise<string> {
    throw new Error("Method not implemented.");
  }
  getDWorkspace(): DWorkspaceV2 {
    const ret: any = {
      wsRoot: this._wsRoot,
      vaults: this._vaults,
    };

    return ret;
  }
  getWorkspaceImplOrThrow(): DWorkspaceV2 {
    throw new Error("Method not implemented.");
  }
  getWorkspaceSettings(): Promise<WorkspaceSettings | undefined> {
    throw new Error("Method not implemented.");
  }
  getWorkspaceSettingsSync(): WorkspaceSettings | undefined {
    throw new Error("Method not implemented.");
  }
  getDendronWorkspaceSettingsSync():
    | Partial<{
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
      }>
    | undefined {
    throw new Error("Method not implemented.");
  }
  getWorkspaceSettingOrDefault({}: {
    wsConfigKey:
      | "dendron.dailyJournalDomain"
      | "dendron.defaultJournalName"
      | "dendron.defaultJournalDateFormat"
      | "dendron.defaultJournalAddBehavior"
      | "dendron.defaultScratchName"
      | "dendron.defaultScratchDateFormat"
      | "dendron.defaultScratchAddBehavior"
      | "dendron.copyNoteUrlRoot"
      | "dendron.linkSelectAutoTitleBehavior"
      | "dendron.defaultLookupCreateBehavior"
      | "dendron.defaultTimestampDecorationFormat"
      | "dendron.rootDir"
      | "dendron.dendronDir"
      | "dendron.logLevel"
      | "dendron.trace.server"
      | "dendron.serverPort";
    dendronConfigKey: string;
  }) {
    throw new Error("Method not implemented.");
  }
  setupViews(_context: ExtensionContext): Promise<void> {
    throw new Error("Method not implemented.");
  }
  addDisposable(_disposable: Disposable): void {
    throw new Error("Method not implemented.");
  }

  /**
   * Note: trustedWorkspace is omitted
   * @returns
   */
  getEngine(): IEngineAPIService {
    return this._engine as IEngineAPIService;
  }
}
