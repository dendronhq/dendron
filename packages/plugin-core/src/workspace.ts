import { DEngine, DNodeUtils, getStage, Note } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import * as vscode from "vscode";
import { LookupController } from "./components/lookup/LookupController";
import { node2Uri } from "./components/lookup/utils";
import {
  CONFIG,
  DENDRON_COMMANDS,
  DENDRON_WS_NAME,
  extensionQualifiedId,
  GLOBAL_STATE,
} from "./constants";
import { Logger } from "./logger";
import { NodeService } from "./services/nodeService/NodeService";
import { Settings } from "./settings";
import {
  resolveTilde,
  VSCodeUtils,
  DisposableStore,
} from "./utils";
import { posix } from "path";
import { HistoryService } from "./services/HistoryService";

function writeWSFile(fpath: string, opts: { rootDir: string, pathOverride?: string }) {
  const cleanOpts = _.defaults(opts, {pathOverride: path.join(opts.rootDir, "vault.main") })
  const jsonBody = {
    folders: [
      {
        path: cleanOpts.pathOverride
      },
    ],
    settings: Settings.defaults(cleanOpts),
    extensions: {
      recommendations: [
        // git version history
        // non-developers don't have git, will leave as optional for now
        // "eamodio.gitlens",
        // markdown extensions
        "shd101wyy.markdown-preview-enhanced",
        // Spellcheck
        "ban.spellright",
        // images
        "mushan.vscode-paste-image",
        // wikilinks, backlinks, and additional goodies
        "kortina.vscode-markdown-notes",
        // material theme
        "equinusocio.vsc-material-theme",
        // markdown shortcuts
        "mdickin.markdown-shortcuts",
      ],
    },
  };
  fs.writeJsonSync(fpath, jsonBody, { spaces: 4 });
}

let _DendronWorkspace: DendronWorkspace | null;

export class DendronWorkspace {
  static instance(): DendronWorkspace {
    if (!_DendronWorkspace) {
      throw Error("Dendronworkspace not initialized");
    }
    return _DendronWorkspace;
  }

  static isActive(): boolean {
    const conf = vscode.workspace.getConfiguration("dendron").get("rootDir");
    if (conf) {
      return true;
    } else {
      return false;
    }
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
  public configDendron: vscode.WorkspaceConfiguration;
  public configWS?: vscode.WorkspaceConfiguration;
  public fsWatcher?: vscode.FileSystemWatcher;
  public L: typeof Logger;
  private _engine?: DEngine;
  public version: string;
  private disposableStore: DisposableStore;
  private history: HistoryService;

  constructor(
    context: vscode.ExtensionContext,
    opts?: { skipSetup?: boolean }
  ) {
    opts = _.defaults(opts, { skipSetup: false });
    this.context = context;
    this.configDendron = vscode.workspace.getConfiguration("dendron");
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

  get rootDir(): string {
    const rootDir = this.configDendron.get<string>(CONFIG.ROOT_DIR);
    if (!rootDir) {
      throw Error("rootDir not initialized");
    }
    return rootDir;
  }

  get extensionAssetsDir(): string {
    const assetsDir = path.join(this.context.extensionPath, "assets");
    return assetsDir;
  }

  private _getVersion(): string  {
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
    return version
  }

  _setupCommands() {
    this.context.subscriptions.push(
      vscode.commands.registerCommand(DENDRON_COMMANDS.INIT_WS, async () => {
        const ctx = DENDRON_COMMANDS.INIT_WS;
        const rootDirDefault = posix.join("~", "Dendron");
        const resp = await vscode.window.showInputBox({
          value: rootDirDefault,
          prompt: "Select your default folder for dendron",
          ignoreFocusOut: true,
        });
        if (!resp) {
          this.L.error({ ctx, msg: "no input" });
          // TODO
          throw Error("must enter");
        }
        this.setupWorkspace(resp);
      })
    );
    this.context.subscriptions.push(
      vscode.commands.registerCommand(DENDRON_COMMANDS.CHANGE_WS, async () => {
        const ctx = DENDRON_COMMANDS.CHANGE_WS;
        const resp = await vscode.window.showInputBox({
          prompt: "Select your folder for dendron",
          ignoreFocusOut: true,
        });
        if (!resp) {
          this.L.error({ ctx, msg: "no input" });
          // TODO
          throw Error("must enter");
        }
        this.changeWorkspace(resp);
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
          await Promise.all(
            _.keys(GLOBAL_STATE).map((k) => {
              this.updateGlobalState(k as keyof typeof GLOBAL_STATE, undefined);
            })
          );
          vscode.window.showInformationMessage(`reset config`);
        }
      )
    );

    this.context.subscriptions.push(
      vscode.commands.registerCommand(DENDRON_COMMANDS.LOOKUP, async () => {
        const ctx = DENDRON_COMMANDS.LOOKUP;
        this.L.info({ ctx: ctx + ":LookupController:pre" });
        const controller = new LookupController(this);
        this.L.info({ ctx: ctx + ":LookupController:post" });
        controller.show();
      })
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
            uri: vscode.Uri.parse(fsPath),
          });
          const note: Note = (await ns.deleteByPath(fsPath, "note")) as Note;
          const closetParent = DNodeUtils.findClosestParent(
            note.logicalPath,
            this.engine.notes,
            { noStubs: true }
          );
          const uri = node2Uri(closetParent);
          try {
            await vscode.window.showTextDocument(uri);
          } catch (err) {
            this.L.error({ ctx, msg: `can't open uri: ${uri}` });
          }
          vscode.window.showInformationMessage(`${posix.basename(fsPath)} deleted`);
        }
      )
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

    if (getStage() === "test") {
      // stubbed for test
      workspaceFolders = [];
      this.configWS = VSCodeUtils.createMockState({});
    } else {
      const wsFolders = VSCodeUtils.getWorkspaceFolders();
      if (_.isUndefined(wsFolders) || _.isEmpty(wsFolders)) {
        this.L.error({
          ctx,
          msg: "no folders set for workspace",
          action: "Please set folder",
        });
        throw Error("no folders set for workspace");
      }
      workspaceFolders = wsFolders;
      this.configWS = vscode.workspace.getConfiguration(
        undefined,
      )
      this.configWS = vscode.workspace.getConfiguration(
        undefined,
        workspaceFolders[0]
      );
    }
    if (getStage() !== "test") {
      this.createWorkspaceWatcher(workspaceFolders);
    }
  }

  async createWorkspaceWatcher(workspaceFolders: readonly vscode.WorkspaceFolder[]) {
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
        const fname = posix.basename(uri.fsPath, ".md");
        const note = new Note({ fname });

        // check if ignore
        const recentEvents = HistoryService.instance().lookBack();
        this.L.debug({ ctx, recentEvents, fname});
        if (_.find(recentEvents, (event => {
          return _.every([event?.uri?.fsPath === uri.fsPath, event.source === "engine", event.action === "create"]);
        }))) {
          this.L.debug({ ctx, uri, msg: "create by engine, ignoring" });
          return;
        }

        try {
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
        const fname = posix.basename(uri.fsPath, ".md");

        // check if we should ignore
        const recentEvents = HistoryService.instance().lookBack();
        this.L.debug({ ctx, recentEvents, fname});
        if (_.find(recentEvents, (event => {
          return _.every([event?.uri?.fsPath === uri.fsPath, event.source === "engine", event.action === "delete"]);
        }))) {
          this.L.debug({ ctx, uri, msg: "recent action by engine, ignoring" });
          return;
        }

        try {
          await this.engine.delete(fname, { metaOnly: true });
        } catch (err) {
          this.L.error({ ctx, err: JSON.stringify(err) });
        }
      }, this)
    );
  }

  async changeWorkspace(rootDirRaw: string) {
    const ctx = "changeWorkspace";
    this.L.info({ ctx, rootDirRaw });
    const rootDir = resolveTilde(rootDirRaw);
    if (!fs.existsSync(rootDir)) {
      throw Error(`${rootDir} does not exist`);
    }
    if (!fs.existsSync(path.join(rootDir, DENDRON_WS_NAME))) {
    writeWSFile(path.join(rootDir, DENDRON_WS_NAME), {
      rootDir,
      pathOverride: rootDir
    });
    }
    VSCodeUtils.openWS(path.join(rootDir, DENDRON_WS_NAME));
  }

  async reloadWorkspace(mainVault?: string) {
    // TODO: dispose of existing workspace
    await this.activateWorkspace();
    if (!mainVault) {
      const wsFolders = vscode.workspace.workspaceFolders;
      mainVault = wsFolders![0].uri.fsPath;
    }
    const engine = DendronEngine.getOrCreateEngine({ root: mainVault });
    await engine.init();
    this._engine = engine;
    return;
  }

  /**
   * Initialize a new directory with dendron files
   * @param rootDirRaw
   * @param opts
   */
  async setupWorkspace(rootDirRaw: string, opts?: { skipOpenWS?: boolean }) {
    opts = _.defaults(opts, { skipOpenWS: false });
    const ctx = "setupWorkspace";
    this.L.info({ ctx, rootDirRaw });
    const rootDir = resolveTilde(rootDirRaw);
    if (fs.existsSync(rootDir)) {
      const options = {
        delete: { msg: "delete existing folder", alias: "d" },
        abort: { msg: "abort current operation", alias: "a" },
        continue: {
          msg: "initialize workspace into current folder",
          alias: "c",
        },
      };
      const resp = await vscode.window.showInputBox({
        prompt: `${rootDir} exists. Please specify the next action. Your options: ${_.map(
          options,
          (v, k) => {
            return `(${k}: ${v.msg})`;
          }
        ).join(", ")}`,
        ignoreFocusOut: true,
        value: "continue",
        validateInput: async (value: string) => {
          if (!_.includes(_.keys(options), value.toLowerCase())) {
            return `not valid input. valid inputs: ${_.keys(options).join(
              ", "
            )}`;
          }
          return null;
        },
      });
      if (resp === "abort") {
        vscode.window.showInformationMessage(
          "did not initialize dendron workspace"
        );
        return;
      } else if (resp === "delete") {
        fs.removeSync(rootDir);
        vscode.window.showInformationMessage("removing existing folder");
      }
    }
    [rootDir].forEach((dirPath: string) => {
      fs.ensureDirSync(dirPath);
    });
    fs.copySync(path.join(this.extensionAssetsDir, "notes"), rootDir);
    writeWSFile(path.join(rootDir, DENDRON_WS_NAME), {
      rootDir,
    });
    if (!opts.skipOpenWS) {
      vscode.window.showInformationMessage("opening dendron workspace");
      return VSCodeUtils.openWS(path.join(rootDir, DENDRON_WS_NAME));
    }
  }

  async showWelcome(welcomeUri?: vscode.Uri, opts?: {reuseWindow?: boolean}) {
    welcomeUri =
      welcomeUri ||
      vscode.Uri.parse(path.join(this.rootDir, "vault.main", "dendron.md"));
    try {
      await vscode.window.showTextDocument(welcomeUri);
      await MarkdownUtils.openPreview(opts);
    } catch (err) {
      vscode.window.showErrorMessage(JSON.stringify(err));
    }
  }
}

class MarkdownUtils {

  static async openPreview(opts?: {reuseWindow?: boolean}) {
    const cleanOpts = _.defaults(opts, {reuseWindow: false});
    let previewEnhanced = vscode.extensions.getExtension(
      "shd101wyy.markdown-preview-enhanced"
    );
    const cmds = {
      builtin: {
        open: "markdown.showPreview",
        openSide: "markdown.showPreviewToSide",
      },
      enhanced: {
        open: "markdown-preview-enhanced.openPreview",
        openSide: "markdown-preview-enhanced.openPreviewToTheSide"
      }
    };
    const mdClient = cmds[previewEnhanced ? "enhanced" : "builtin"];
    const openCmd = mdClient[cleanOpts.reuseWindow ? "open" : "openSide"];
    return vscode.commands.executeCommand(openCmd);
  }
}
