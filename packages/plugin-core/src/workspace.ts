import { DendronConfig, DEngine, getStage, Note } from "@dendronhq/common-all";
import { mdFile2NodeProps } from "@dendronhq/common-server";
import { DConfig } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import open from "open";
import path from "path";
import * as vscode from "vscode";
import { BuildPodCommand } from "./commands/BuildPod";
import { ChangeWorkspaceCommand } from "./commands/ChangeWorkspace";
import { CreateJournalCommand } from "./commands/CreateJournal";
import { CreateScratchCommand } from "./commands/CreateScratch";
import { DoctorCommand } from "./commands/Doctor";
import { ImportPodCommand } from "./commands/ImportPod";
import { OpenLogsCommand } from "./commands/OpenLogs";
import { ReloadIndexCommand } from "./commands/ReloadIndex";
import { ResetConfigCommand } from "./commands/ResetConfig";
import { SetupWorkspaceCommand } from "./commands/SetupWorkspace";
import { ShowHelpCommand } from "./commands/ShowHelp";
import { UpgradeSettingsCommand } from "./commands/UpgradeSettings";
import { LookupController } from "./components/lookup/LookupController";
import {
  DENDRON_COMMANDS,
  extensionQualifiedId,
  GLOBAL_STATE,
} from "./constants";
import { Logger } from "./logger";
import { HistoryService } from "./services/HistoryService";
import { NodeService } from "./services/nodeService/NodeService";
import { DisposableStore, resolvePath, VSCodeUtils } from "./utils";
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

  static workspaceFile(): vscode.Uri {
    if (!vscode.workspace.workspaceFile) {
      throw Error("no workspace file");
    }
    return vscode.workspace.workspaceFile;
  }

  static workspaceFolders(): readonly vscode.WorkspaceFolder[] | undefined {
    return vscode.workspace.workspaceFolders;
  }

  /**
   * Currently, this is a check to see if rootDir is defined in settings
   */
  static isActive(): boolean {
    return !_.isUndefined(DendronWorkspace.rootDir());
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
  public _engine?: DEngine;
  public version: string;
  private disposableStore: DisposableStore;
  private history: HistoryService;
  public config?: DendronConfig;

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
        await new SetupWorkspaceCommand().run();
      })
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.CREATE_SCRATCH_NOTE,
        async () => {
          await new CreateScratchCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.CREATE_JOURNAL_NOTE,
        async () => {
          await new CreateJournalCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(DENDRON_COMMANDS.CHANGE_WS, async () => {
        await new ChangeWorkspaceCommand().run();
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
          await new ResetConfigCommand().run();
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(DENDRON_COMMANDS.LOOKUP, async () => {
        const ctx = DENDRON_COMMANDS.LOOKUP;
        this.L.info({ ctx: ctx + ":LookupController:pre" });
        const controller = new LookupController(this, { flavor: "note" });
        this.L.info({ ctx: ctx + ":LookupController:post" });
        controller.show();
      })
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(
        DENDRON_COMMANDS.LOOKUP_SCHEMA,
        async () => {
          const controller = new LookupController(this, { flavor: "schema" });
          controller.show();
        }
      )
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
          const mode = fsPath.endsWith(".md") ? "note" : "schema";
          await ns.deleteByPath(fsPath, mode);
          vscode.window.showInformationMessage(
            `${path.basename(fsPath)} deleted`
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
        const { text } = VSCodeUtils.getSelection();
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
          await new ReloadIndexCommand().execute();
          if (!silent) {
            vscode.window.showInformationMessage(`finish reload`);
          }
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(DENDRON_COMMANDS.SHOW_HELP, async () => {
        await new ShowHelpCommand().execute();
      })
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(DENDRON_COMMANDS.OPEN_LOGS, async () => {
        try {
          await new OpenLogsCommand().execute({});
        } catch (err) {
          Logger.error(JSON.stringify(err));
        }
      })
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

    this.context.subscriptions.push(
      vscode.commands.registerCommand(DENDRON_COMMANDS.BUILD_POD, async () => {
        await new BuildPodCommand().run();
      })
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(DENDRON_COMMANDS.DOCTOR, async () => {
        await new DoctorCommand().run();
      })
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
    const rootDir = DendronWorkspace.rootDir();
    if (!rootDir) {
      throw `rootDir not set`;
    }
    this.config = DConfig.getOrCreate(rootDir);

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

  async deactivate() {
    const ctx = "deactivateWorkspace";
    this.L.info({ ctx });
    this.fsWatcher?.dispose();
    this.disposableStore.dispose();
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
        const fname = path.basename(uri.fsPath, ".md");
        const noteRaw = mdFile2NodeProps(uri.fsPath);
        const note = new Note({ ...noteRaw, parent: null, children: [] });

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
          this.L.debug({ ctx, uri, msg: "adding to engine" });
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
        const fname = path.basename(uri.fsPath, ".md");

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
          const nodeToDelete = _.find(this.engine.notes, { fname });
          if (_.isUndefined(nodeToDelete)) {
            throw `${fname} not found`;
          }
          await this.engine.delete(nodeToDelete.id, "note", { metaOnly: true });
        } catch (err) {
          this.L.error({ ctx, err: JSON.stringify(err) });
        }
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
    // TODO: dispose of existing workspace
    await this.activateWorkspace();
    if (!mainVault) {
      const wsFolders = DendronWorkspace.workspaceFolders();
      mainVault = wsFolders![0].uri.fsPath;
    }
    try {
      await vscode.commands.executeCommand(DENDRON_COMMANDS.RELOAD_INDEX, true);
      return;
    } catch (err) {
      vscode.window.showErrorMessage(
        `error initializing dendron: ${JSON.stringify(err)}`
      );
    }
  }

  async showWelcome(welcomeUri?: vscode.Uri, opts?: { reuseWindow?: boolean }) {
    welcomeUri =
      welcomeUri ||
      vscode.Uri.joinPath(this.rootWorkspace.uri, "dendron.quickstart.md");
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
