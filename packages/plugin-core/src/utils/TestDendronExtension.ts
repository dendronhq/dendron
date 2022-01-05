// import {
//   WorkspaceType,
//   DWorkspaceV2,
//   WorkspaceSettings,
// } from "@dendronhq/common-all";
// import { IWorkspaceService } from "@dendronhq/engine-server";
// import { ExtensionContext, FileSystemWatcher, Disposable } from "vscode";
// import { ICommandFactory } from "../commandFactoryInterface";
// import { ILookupControllerV3Factory } from "../components/lookup/LookupControllerV3Interface";
// import {
//   INoteLookupProviderFactory,
//   ISchemaLookupProviderFactory,
// } from "../components/lookup/LookupProviderV3Interface";
// import { IDendronExtension } from "../dendronExtensionInterface";
// import { IEngineAPIService } from "../services/EngineAPIServiceInterface";
// import { INoteSyncService } from "../services/NoteSyncService";
// import { ISchemaSyncService } from "../services/SchemaSyncServiceInterface";
// import { IWSUtilsV2 } from "../WSUtilsV2Interface";

// export class TestDendronExtension implements IDendronExtension {
//   port?: number | undefined;
//   context: ExtensionContext;
//   serverWatcher?: FileSystemWatcher | undefined;
//   type: WorkspaceType;
//   wsUtils: IWSUtilsV2;
//   commandFactory: ICommandFactory;
//   schemaSyncService: ISchemaSyncService;
//   workspaceService?: IWorkspaceService | undefined;
//   noteSyncService: INoteSyncService;
//   lookupControllerFactory: ILookupControllerV3Factory;
//   noteLookupProviderFactory: INoteLookupProviderFactory;
//   schemaLookupProviderFactory: ISchemaLookupProviderFactory;
//   pauseWatchers<T = void>(cb: () => Promise<T>): Promise<T> {
//     throw new Error("Method not implemented.");
//   }
//   getClientAPIRootUrl(): Promise<string> {
//     throw new Error("Method not implemented.");
//   }
//   getDWorkspace(): DWorkspaceV2 {
//     throw new Error("Method not implemented.");
//   }
//   getWorkspaceImplOrThrow(): DWorkspaceV2 {
//     throw new Error("Method not implemented.");
//   }
//   getWorkspaceSettings(): Promise<WorkspaceSettings | undefined> {
//     throw new Error("Method not implemented.");
//   }
//   getWorkspaceSettingsSync(): WorkspaceSettings | undefined {
//     throw new Error("Method not implemented.");
//   }
//   getDendronWorkspaceSettingsSync():
//     | Partial<{
//         "dendron.dailyJournalDomain": string;
//         "dendron.defaultJournalName": string;
//         "dendron.defaultJournalDateFormat": string;
//         "dendron.defaultJournalAddBehavior": string;
//         "dendron.defaultScratchName": string;
//         "dendron.defaultScratchDateFormat": string;
//         "dendron.defaultScratchAddBehavior": string;
//         "dendron.copyNoteUrlRoot": string;
//         "dendron.linkSelectAutoTitleBehavior": string;
//         "dendron.defaultLookupCreateBehavior": string;
//         "dendron.defaultTimestampDecorationFormat": string;
//         "dendron.rootDir": string;
//         "dendron.dendronDir": string;
//         "dendron.logLevel": string;
//         "dendron.trace.server": string;
//         "dendron.serverPort": string;
//       }>
//     | undefined {
//     throw new Error("Method not implemented.");
//   }
//   getWorkspaceSettingOrDefault({
//     wsConfigKey,
//     dendronConfigKey,
//   }: {
//     wsConfigKey:
//       | "dendron.dailyJournalDomain"
//       | "dendron.defaultJournalName"
//       | "dendron.defaultJournalDateFormat"
//       | "dendron.defaultJournalAddBehavior"
//       | "dendron.defaultScratchName"
//       | "dendron.defaultScratchDateFormat"
//       | "dendron.defaultScratchAddBehavior"
//       | "dendron.copyNoteUrlRoot"
//       | "dendron.linkSelectAutoTitleBehavior"
//       | "dendron.defaultLookupCreateBehavior"
//       | "dendron.defaultTimestampDecorationFormat"
//       | "dendron.rootDir"
//       | "dendron.dendronDir"
//       | "dendron.logLevel"
//       | "dendron.trace.server"
//       | "dendron.serverPort";
//     dendronConfigKey: string;
//   }) {
//     throw new Error("Method not implemented.");
//   }
//   setupViews(context: ExtensionContext): Promise<void> {
//     throw new Error("Method not implemented.");
//   }
//   addDisposable(disposable: Disposable): void {
//     throw new Error("Method not implemented.");
//   }
//   getEngine(): IEngineAPIService {
//     throw new Error("Method not implemented.");
//   }
// }
