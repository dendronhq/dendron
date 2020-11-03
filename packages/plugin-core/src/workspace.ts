import {
  CONSTANTS,
  DendronConfig,
  DEngineClientV2,
  DVault,
  getStage,
} from "@dendronhq/common-all";
import { readMD } from "@dendronhq/common-server";
import { DConfig } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import open from "open";
import path from "path";
import * as vscode from "vscode";
import { ArchiveHierarchyCommand } from "./commands/ArchiveHierarchy";
import { BuildPodCommand } from "./commands/BuildPod";
import { ChangeWorkspaceCommand } from "./commands/ChangeWorkspace";
import { ConfigurePodCommand } from "./commands/ConfigurePodCommand";
import { ContributeCommand } from "./commands/Contribute";
import { CopyNoteLinkCommand } from "./commands/CopyNoteLink";
import { CopyNoteRefCommand } from "./commands/CopyNoteRef";
import { CopyNoteURLCommand } from "./commands/CopyNoteURL";
import { CreateDailyJournalCommand } from "./commands/CreateDailyJournal";
import { DeleteNodeCommand } from "./commands/DeleteNodeCommand";
import { DoctorCommand } from "./commands/Doctor";
import { DumpStateCommand } from "./commands/DumpStateCommand";
import { ExportPodCommand } from "./commands/ExportPod";
import { GoDownCommand } from "./commands/GoDownCommand";
import { GotoNoteCommand, GotoNoteCommandOpts } from "./commands/GotoNote";
import { GoToSiblingCommand } from "./commands/GoToSiblingCommand";
import { GoUpCommand } from "./commands/GoUpCommand";
import { ImportPodCommand } from "./commands/ImportPod";
import { LookupCommand } from "./commands/LookupCommand";
import { OpenLogsCommand } from "./commands/OpenLogs";
import { PublishCommand } from "./commands/Publish";
import { PublishPodCommand } from "./commands/PublishPod";
import { RefactorHierarchyCommandV2 } from "./commands/RefactorHierarchyV2";
import { ReloadIndexCommand } from "./commands/ReloadIndex";
import { RenameNoteV2aCommand } from "./commands/RenameNoteV2a";
import { ResetConfigCommand } from "./commands/ResetConfig";
import { RestoreVaultCommand } from "./commands/RestoreVault";
import { SetupWorkspaceCommand } from "./commands/SetupWorkspace";
import { ShowHelpCommand } from "./commands/ShowHelp";
import { ShowPreviewCommand } from "./commands/ShowPreview";
import { SnapshotVaultCommand } from "./commands/SnapshotVault";
import { UpdateSchemaCommand } from "./commands/UpdateSchema";
import { UpgradeSettingsCommand } from "./commands/UpgradeSettings";
import {
  DENDRON_COMMANDS,
  extensionQualifiedId,
  GLOBAL_STATE,
} from "./constants";
import { VaultWatcher } from "./fileWatcher";
import { Logger } from "./logger";
import { HistoryService } from "./services/HistoryService";
import { DisposableStore, resolvePath, VSCodeUtils } from "./utils";
import { isAnythingSelected } from "./utils/editor";
import { DendronTreeViewV2 } from "./views/DendronTreeViewV2";
import { SchemaWatcher } from "./watchers/schemaWatcher";
import { WindowWatcher } from "./windowWatcher";
import { WorkspaceWatcher } from "./WorkspaceWatcher";

let _DendronWorkspace: DendronWorkspace | null;

export type ServerConfiguration = {
  serverPort: string;
};

export class DendronWorkspace {
  static DENDRON_WORKSPACE_FILE: string = "dendron.code-workspace";
  static _SERVER_CONFIGURATION: Partial<ServerConfiguration>;

  public dendronTreeView: DendronTreeViewV2 | undefined;
  public vaultWatcher?: VaultWatcher;

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

  /**
   * Full path to workspace root
   */
  static rootDir(): string | undefined {
    const rootDir = DendronWorkspace.configuration().get<string>(
      "dendron.rootDir"
    );
    if (rootDir) {
      return resolvePath(
        rootDir,
        path.dirname(DendronWorkspace.workspaceFile().fsPath)
      );
    }
    return rootDir;
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
    const rootDir = DendronWorkspace.rootDir();
    return !_.isUndefined(rootDir) && !_.isEmpty(rootDir);
  }

  static version(): string {
    let version: string | undefined;
    if (VSCodeUtils.isDebuggingExtension()) {
      version = VSCodeUtils.getVersionFromPkg();
    } else {
      try {
        const dendronExtension = vscode.extensions.getExtension(
          extensionQualifiedId
        )!;
        version = dendronExtension.packageJSON.version;
      } catch (err) {
        version = VSCodeUtils.getVersionFromPkg();
      }
    }
    if (_.isUndefined(version)) {
      version = "0.0.0";
    }
    return version;
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
  public windowWatcher?: WindowWatcher;
  public fsWatcher?: vscode.FileSystemWatcher;
  public serverWatcher?: vscode.FileSystemWatcher;
  public schemaWatcher?: SchemaWatcher;
  public L: typeof Logger;
  public _enginev2?: DEngineClientV2;
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

  constructor(
    context: vscode.ExtensionContext,
    opts?: { skipSetup?: boolean }
  ) {
    opts = _.defaults(opts, { skipSetup: false });
    this.context = context;
    _DendronWorkspace = this;
    this.L = Logger;
    this.disposableStore = new DisposableStore();
    if (!opts.skipSetup) {
      this._setupCommands();
    }
    const ctx = "DendronWorkspace";
    this.L.info({ ctx, msg: "initialized" });
  }

  get config(): DendronConfig {
    const rootDir = DendronWorkspace.rootDir();
    if (!rootDir) {
      throw `rootDir not set`;
    }
    return DConfig.getOrCreate(rootDir);
  }

  get podsDir(): string {
    const rootDir = DendronWorkspace.rootDir();
    if (!rootDir) {
      throw `rootdir not set`;
    }
    const podsPath = path.join(rootDir, "pods");
    fs.ensureDirSync(podsPath);
    return podsPath;
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

  get vaults(): DVault[] {
    return (
      DendronWorkspace.workspaceFolders()?.map((ent) => ({
        fsPath: ent.uri.fsPath,
      })) || []
    );
  }

  getEngine(): DEngineClientV2 {
    if (!this._enginev2) {
      throw Error("engine not set");
    }
    return this._enginev2;
  }

  setEngine(engine: DEngineClientV2) {
    this._enginev2 = engine;
  }

  _setupCommands() {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.INIT_WS.key,
        async () => {
          await new SetupWorkspaceCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.SNAPSHOT_VAULT.key,
        async () => {
          await new SnapshotVaultCommand().run();
        }
      )
    );
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.RESTORE_VAULT.key,
        async () => {
          await new RestoreVaultCommand().run();
        }
      )
    );
    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.CONTRIBUTE.key,
        async () => {
          await new ContributeCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.SHOW_PREVIEW.key,
        async () => {
          await new ShowPreviewCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.GOTO_NOTE.key,
        async (opts: GotoNoteCommandOpts) => {
          new GotoNoteCommand().execute(opts);
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.DUMP_STATE.key,
        async () => {
          return new DumpStateCommand().execute();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.CHANGE_WS.key,
        async () => {
          await new ChangeWorkspaceCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.RESET_CONFIG.key,
        async () => {
          await new ResetConfigCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.PUBLISH.key,
        async (args: any) => {
          await new PublishCommand().run(args);
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.PUBLISH_POD.key,
        async (args: any) => {
          await new PublishPodCommand().run(args);
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.LOOKUP.key,
        async (args: any) => {
          new LookupCommand().run({ ...args, flavor: "note" });
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
        DENDRON_COMMANDS.DELETE_NODE.key,
        async () => {
          return new DeleteNodeCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.OPEN_LINK.key,
        async () => {
          const ctx = DENDRON_COMMANDS.OPEN_LINK;
          this.L.info({ ctx });
          if (!isAnythingSelected()) {
            return vscode.window.showErrorMessage("nothing selected");
          }
          const { text } = VSCodeUtils.getSelection();
          if (_.isUndefined(text)) {
            return vscode.window.showErrorMessage("nothing selected");
          }
          const assetPath = resolvePath(text, this.rootWorkspace.uri.fsPath);
          if (!fs.existsSync(assetPath)) {
            return vscode.window.showErrorMessage(
              `${assetPath} does not exist`
            );
          }
          return open(assetPath).catch((err) => {
            vscode.window.showInformationMessage(
              "error: " + JSON.stringify(err)
            );
          });
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.IMPORT_POD.key,
        async () => {
          await new ImportPodCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.RELOAD_INDEX.key,
        async (silent?: boolean) => {
          const out = await new ReloadIndexCommand().execute();
          if (!silent) {
            vscode.window.showInformationMessage(`finish reload`);
          }
          return out;
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.SHOW_HELP.key,
        async () => {
          await new ShowHelpCommand().execute();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.OPEN_LOGS.key,
        async () => {
          try {
            await new OpenLogsCommand().execute({});
          } catch (err) {
            Logger.error(JSON.stringify(err));
          }
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.UPGRADE_SETTINGS.key,
        async () => {
          return await new UpgradeSettingsCommand().execute({
            settingOpts: { force: true },
          });
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.BUILD_POD.key,
        async (args: any) => {
          await new BuildPodCommand().run(args);
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(DENDRON_COMMANDS.DOCTOR.key, async () => {
        await new DoctorCommand().run();
      })
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.RENAME_NOTE.key,
        async () => {
          await new RenameNoteV2aCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.COPY_NOTE_LINK.key,
        async () => {
          await new CopyNoteLinkCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.COPY_NOTE_REF.key,
        async () => {
          await new CopyNoteRefCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.REFACTOR_HIERARCHY.key,
        async () => {
          await new RefactorHierarchyCommandV2().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.ARCHIVE_HIERARCHY.key,
        async () => {
          await new ArchiveHierarchyCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.CREATE_DAILY_JOURNAL_NOTE.key,
        async () => {
          await new CreateDailyJournalCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.GO_UP_HIERARCHY.key,
        async () => {
          await new GoUpCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.UPDATE_SCHEMA.key,
        async () => {
          await new UpdateSchemaCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.EXPORT_POD.key,
        async () => {
          await new ExportPodCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.CONFIGURE_POD.key,
        async () => {
          await new ConfigurePodCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.COPY_NOTE_URL.key,
        async () => {
          await new CopyNoteURLCommand().run();
        }
      )
    );

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

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.GO_DOWN_HIERARCHY.key,
        async () => {
          await new GoDownCommand().run();
        }
      )
    );
  }

  addDisposable(_disposable: vscode.Disposable) {
    // TODO
    // handle all disposables
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
  async activateWatchers() {
    const ctx = "activateWorkspace";
    const stage = getStage();
    this.L.info({ ctx, stage, msg: "enter" });
    const rootDir = DendronWorkspace.rootDir();
    if (!rootDir) {
      throw `rootDir not set`;
    }

    const windowWatcher = new WindowWatcher();
    windowWatcher.activate(this.context);
    windowWatcher.triggerUpdateDecorations();
    this.windowWatcher = windowWatcher;
    const workspaceWatcher = new WorkspaceWatcher();
    workspaceWatcher.activate(this.context);

    const wsFolders = DendronWorkspace.workspaceFolders();
    if (_.isUndefined(wsFolders) || _.isEmpty(wsFolders)) {
      this.L.error({
        ctx,
        msg: "no folders set for workspace",
        action: "Please set folder",
      });
      throw Error("no folders set for workspace");
    }
    let vaults = wsFolders as vscode.WorkspaceFolder[];
    const vaultWatcher = new VaultWatcher({
      vaults,
    });
    const schemaWatcher = new SchemaWatcher({ vaults });
    schemaWatcher.activate(this.context);
    this.schemaWatcher = schemaWatcher;

    let disposables = vaultWatcher.activate();
    disposables.map((d) => {
      this.disposableStore.add(d);
    });
    this.vaultWatcher = vaultWatcher;
  }

  async deactivate() {
    const ctx = "deactivateWorkspace";
    this.L.info({ ctx });
    this.fsWatcher?.dispose();
    this.disposableStore.dispose();
  }

  async createServerWatcher() {
    const ctx = "createServerWatcher";
    const portFile = path.join(
      path.dirname(DendronWorkspace.workspaceFile().fsPath),
      CONSTANTS.DENDRON_SERVER_PORT
    );
    this.L.info({ ctx, portFile });
    this.serverWatcher = vscode.workspace.createFileSystemWatcher(
      portFile,
      false,
      false,
      false
    );
    const updateServerConfig = (uri: vscode.Uri) => {
      const port = _.trim(fs.readFileSync(uri.fsPath, { encoding: "utf-8" }));
      DendronWorkspace.serverConfiguration()["serverPort"] = port;
      const ctx = "updateServerConfig";
      this.L.info({ ctx, msg: "update serverConfig", port });
      HistoryService.instance().add({
        source: "apiServer",
        action: "changedPort",
      });
    };

    // file watcher can't watch outside of workspace and our integ tests mock workspaces
    if (getStage() === "test") {
      fs.watchFile(portFile, () => {
        fs.existsSync(portFile) &&
          updateServerConfig(vscode.Uri.file(portFile));
      });
    }

    this.disposableStore.add(
      this.serverWatcher.onDidCreate(async (uri: vscode.Uri) => {
        const ctx = "createServerWatcher.onDidCreate";
        this.L.info({ ctx, uri });
        updateServerConfig(uri);
      }, this)
    );

    this.disposableStore.add(
      this.serverWatcher.onDidChange(async (uri: vscode.Uri) => {
        const ctx = "createServerWatcher.onDidChange";
        this.L.info({ ctx, uri });
        updateServerConfig(uri);
      }, this)
    );
  }

  /**
   * Performs a series of step to initialize the workspace
   *  Calls activate workspace
   * - initializes DendronEngine
   * @param mainVault
   */
  async reloadWorkspace(mainVault?: string) {
    if (!mainVault) {
      const wsFolders = DendronWorkspace.workspaceFolders();
      mainVault = wsFolders![0].uri.fsPath;
    }
    try {
      const out = await vscode.commands.executeCommand(
        DENDRON_COMMANDS.RELOAD_INDEX.key,
        true
      );
      return out;
    } catch (err) {
      vscode.window.showErrorMessage(
        `error initializing dendron: ${JSON.stringify(err)}`
      );
    }
  }

  async showWelcome(
    welcomeUri?: vscode.Uri,
    _opts?: { reuseWindow?: boolean }
  ) {
    welcomeUri =
      welcomeUri ||
      vscode.Uri.joinPath(this.rootWorkspace.uri, "dendron.quickstart.md");
    try {
      const { content } = readMD(welcomeUri.fsPath);
      if (getStage() !== "test") {
        VSCodeUtils.showWebView({ title: "Welcome", content });
      }
    } catch (err) {
      vscode.window.showErrorMessage(JSON.stringify(err));
    }
  }
}
