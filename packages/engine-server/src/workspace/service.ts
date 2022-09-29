import {
  asyncLoopOneAtATime,
  ConfigUtils,
  CONSTANTS,
  CURRENT_CONFIG_VERSION,
  DendronError,
  DENDRON_VSCODE_CONFIG_KEYS,
  DEngineClient,
  Disposable,
  DuplicateNoteActionEnum,
  DUser,
  DUtils,
  DVault,
  DVaultSync,
  DWorkspace,
  DWorkspaceEntry,
  FOLDERS,
  InstallStatus,
  IntermediateDendronConfig,
  isNotUndefined,
  isWebUri,
  normalizeUnixPath,
  NoteUtils,
  SchemaUtils,
  SeedEntry,
  SelfContainedVault,
  stringifyError,
  Time,
  VaultUtils,
  WorkspaceSettings,
} from "@dendronhq/common-all";
import {
  assignJSONWithComment,
  createDisposableLogger,
  DConfig,
  DLogger,
  getAllFiles,
  GitUtils,
  moveIfExists,
  note2File,
  pathForVaultRoot,
  readJSONWithComments,
  schemaModuleOpts2File,
  simpleGit,
  vault2Path,
  writeJSONWithComments,
  writeJSONWithCommentsSync,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import os from "os";
import path, { basename } from "path";
import { URI } from "vscode-uri";
import { WorkspaceUtils } from ".";
import { MetadataService } from "../metadata";
import {
  CONFIG_MIGRATIONS,
  MigrationChangeSetStatus,
  MigrationService,
} from "../migrations";
import { SeedService, SeedUtils } from "../seed";
import { Git } from "../topics/git";
import { WSMeta } from "../types";
import {
  EngineUtils,
  getWSMetaFilePath,
  openWSMetaFile,
  removeCache,
  writeWSMetaFile,
} from "../utils";
import { WorkspaceConfig } from "./vscode";
import {
  IWorkspaceService,
  SyncActionResult,
  SyncActionStatus,
} from "./workspaceServiceInterface";

const DENDRON_WS_NAME = CONSTANTS.DENDRON_WS_NAME;

export type PathExistBehavior = "delete" | "abort" | "continue";

export type WorkspaceServiceCreateOpts = {
  wsRoot: string;
  /**
   * Does workspace come with a vault?
   * - for self contained vault, this is the `notes` folder
   * - for non-self contained vault, this is whatever the user passes in
   */
  wsVault?: DVault;
  /**
   * Additional vaults to create
   */
  additionalVaults?: DVault[];
  /**
   * create dendron.code-workspace file
   */
  createCodeWorkspace?: boolean;
  /** Create a self contained vault as the workspace */
  useSelfContainedVault?: boolean;
};

export type WorkspaceServiceOpts = {
  wsRoot: string;
  seedService?: SeedService;
};

type UrlTransformerFunc = (url: string) => string;

type AddRemoveCommonOpts = {
  /**
   * Default: true
   */
  updateConfig?: boolean;
  /**
   * Default: false
   */
  updateWorkspace?: boolean;

  /**
   * Method to run immediately before updating the workspace file - this is
   * useful as updating the workspace file while it's open will sometimes cause
   * the window to reload and the plugin to restart
   */
  onUpdatingWorkspace?: () => Promise<void>;

  /**
   * Method to run immediately after updating the workspace file
   */
  onUpdatedWorkspace?: () => Promise<void>;
};

const ROOT_NOTE_TEMPLATE = [
  "# Welcome to Dendron",
  "",
  `This is the root of your dendron vault. If you decide to publish your entire vault, this will be your landing page. You are free to customize any part of this page except the frontmatter on top.`,
  "",
  "## Lookup",
  "",
  "This section contains useful links to related resources.",
  "",
  "- [Getting Started Guide](https://link.dendron.so/6b25)",
  "- [Discord](https://link.dendron.so/6b23)",
  "- [Home Page](https://wiki.dendron.so/)",
  "- [Github](https://link.dendron.so/6b24)",
  "- [Developer Docs](https://docs.dendron.so/)",
].join("\n");

/** You **must** dispose workspace services you create, otherwise you risk leaking file descriptors which may lead to crashes. */
export class WorkspaceService implements Disposable, IWorkspaceService {
  public logger: DLogger;
  private loggerDispose: () => any;
  protected _seedService: SeedService;

  static isNewVersionGreater({
    oldVersion,
    newVersion,
  }: {
    oldVersion: string;
    newVersion: string;
  }) {
    return DUtils.semver.lt(oldVersion, newVersion);
  }

  static async isWorkspaceVault(fpath: string) {
    return (
      // Config file exists
      (await fs.pathExists(path.join(fpath, CONSTANTS.DENDRON_CONFIG_FILE))) &&
      // And is not a self contained vault
      !(await fs.pathExists(path.join(fpath, FOLDERS.NOTES)))
    );
  }

  public wsRoot: string;

  /** Reminder: you **must** dispose workspace services you create, otherwise you risk leaking file descriptors which may lead to crashes. */
  constructor({ wsRoot, seedService }: WorkspaceServiceOpts) {
    this.wsRoot = wsRoot;
    const { logger, dispose } = createDisposableLogger();
    this.logger = logger;
    this.loggerDispose = dispose;
    this._seedService = seedService || new SeedService({ wsRoot });
  }

  dispose() {
    this.loggerDispose();
  }

  get user(): DUser {
    const fpath = path.join(this.wsRoot, CONSTANTS.DENDRON_USER_FILE);
    if (fs.existsSync(fpath)) {
      return new DUser(_.trim(fs.readFileSync(fpath, { encoding: "utf8" })));
    } else {
      return DUser.createAnonymous();
    }
  }

  /**
   * @deprecated: not applicable for self cotnained vaults
   */
  static getOrCreateConfig(wsRoot: string) {
    return DConfig.getOrCreate(wsRoot);
  }

  get config(): IntermediateDendronConfig {
    // TODO: don't read all the time but cache
    const { error, data } = DConfig.readConfigAndApplyLocalOverrideSync(
      this.wsRoot
    );
    if (error) this.logger.error(stringifyError(error));
    return data;
  }

  get seedService(): SeedService {
    return this._seedService;
  }

  // NOTE: this is not accurate until the workspace is initialized
  get vaults(): DVault[] {
    return this.config.workspace.vaults;
  }

  async setConfig(config: IntermediateDendronConfig) {
    const wsRoot = this.wsRoot;
    return DConfig.writeConfig({ wsRoot, config });
  }

  setCodeWorkspaceSettingsSync(config: WorkspaceSettings) {
    writeJSONWithCommentsSync(
      path.join(this.wsRoot, CONSTANTS.DENDRON_WS_NAME),
      config
    );
  }

  getCodeWorkspaceSettingsSync(): WorkspaceSettings | undefined {
    const resp = WorkspaceUtils.getCodeWorkspaceSettingsSync(this.wsRoot);
    if (resp.error) {
      this.logger.error(resp.error);
      return undefined;
    }
    return resp.data;
  }

  /**
   *
   * @param param0
   * @returns `{vaults}` that have been added
   */
  async addWorkspace({ workspace }: { workspace: DWorkspace }) {
    const config = DConfig.readConfigSync(this.wsRoot);
    const allWorkspaces = ConfigUtils.getWorkspace(config).workspaces || {};
    allWorkspaces[workspace.name] = _.omit(workspace, ["name", "vaults"]);
    // update vault
    const newVaults = await _.reduce(
      workspace.vaults,
      async (acc, vault) => {
        const out = await acc;
        out.push(
          await this.addVault({
            config,
            vault: { ...vault, workspace: workspace.name },
            updateConfig: false,
          })
        );
        return out;
      },
      Promise.resolve([] as DVault[])
    );
    ConfigUtils.setWorkspaceProp(config, "workspaces", allWorkspaces);
    await this.setConfig(config);
    return { vaults: newVaults };
  }

  /**
   *
   *
   * @param opts.vault - {@link DVault} to add to workspace
   * @param opts.config - if passed it, make modifications on passed in config instead of {wsRoot}/dendron.yml
   * @param opts.updateConfig - default: true, add to dendron.yml
   * @param opts.updateWorkspace - default: false, add to dendron.code-workspace. Make sure to keep false for Native workspaces.
   * @returns
   */
  async addVault(
    opts: {
      vault: DVault;
      config?: IntermediateDendronConfig;
    } & AddRemoveCommonOpts
  ) {
    const { vault, updateConfig, updateWorkspace } = _.defaults(opts, {
      updateConfig: true,
      updateWorkspace: false,
    });
    let { config } = opts;

    // if we are updating the config, we should make sure
    // we don't include the local overrides
    if (config === undefined) {
      config = this.config;
      if (updateConfig) {
        config = DConfig.readConfigSync(this.wsRoot);
      }
    }

    // Normalize the vault path to unix style (forward slashes) which is better for cross-compatibility
    vault.fsPath = normalizeUnixPath(vault.fsPath);
    const vaults = ConfigUtils.getVaults(config);
    vaults.unshift(vault);
    ConfigUtils.setVaults(config, vaults);

    // update dup note behavior
    const publishingConfig = ConfigUtils.getPublishingConfig(config);
    if (!publishingConfig.duplicateNoteBehavior) {
      const vaults = ConfigUtils.getVaults(config);
      const updatedDuplicateNoteBehavior = {
        action: DuplicateNoteActionEnum.useVault,
        payload: vaults.map((v) => VaultUtils.getName(v)),
      };
      ConfigUtils.setDuplicateNoteBehavior(
        config,
        updatedDuplicateNoteBehavior
      );
    } else if (_.isArray(publishingConfig.duplicateNoteBehavior.payload)) {
      const updatedDuplicateNoteBehavior =
        publishingConfig.duplicateNoteBehavior;
      (updatedDuplicateNoteBehavior.payload as string[]).push(
        VaultUtils.getName(vault)
      );
      ConfigUtils.setDuplicateNoteBehavior(
        config,
        updatedDuplicateNoteBehavior
      );
    }
    if (updateConfig) {
      await this.setConfig(config);
    }
    if (updateWorkspace) {
      const wsPath = path.join(this.wsRoot, DENDRON_WS_NAME);
      let out = (await readJSONWithComments(
        wsPath
      )) as unknown as WorkspaceSettings;
      if (
        !_.find(out.folders, (ent) => ent.path === VaultUtils.getRelPath(vault))
      ) {
        const vault2Folder = VaultUtils.toWorkspaceFolder(vault);
        const folders = [vault2Folder].concat(out.folders);
        out = assignJSONWithComment({ folders }, out);

        if (opts.onUpdatingWorkspace) {
          await opts.onUpdatingWorkspace();
        }
        await writeJSONWithComments(wsPath, out);

        if (opts.onUpdatedWorkspace) {
          await opts.onUpdatedWorkspace();
        }
      }
    } else {
      // Run the hooks even if not updating the workspace file (native workspace), because other code depends on it.
      if (opts.onUpdatingWorkspace) {
        await opts.onUpdatingWorkspace();
      }
      if (opts.onUpdatedWorkspace) {
        await opts.onUpdatedWorkspace();
      }
    }
    return vault;
  }

  /**
   * Create vault files if it does not exist
   * @param opts.noAddToConfig: don't add to dendron.yml
   * @param opts.addToCodeWorkspace: add to dendron.code-workspace
   * @returns void
   *
   * Effects:
   *   - updates `dendron.yml` if `noAddToConfig` is not set
   *   - create directory
   *   - create root note and root schema
   */
  async createVault(
    opts: {
      noAddToConfig?: boolean;
      addToCodeWorkspace?: boolean;
    } & Parameters<WorkspaceService["addVault"]>[0]
  ) {
    const { vault, noAddToConfig } = opts;
    const vpath = vault2Path({ vault, wsRoot: this.wsRoot });
    await fs.ensureDir(vpath);

    const note = NoteUtils.createRoot({
      vault,
      body: ROOT_NOTE_TEMPLATE,
    });
    const schema = SchemaUtils.createRootModule({ vault });

    if (!fs.existsSync(NoteUtils.getFullPath({ note, wsRoot: this.wsRoot }))) {
      await note2File({ note, vault, wsRoot: this.wsRoot });
    }
    if (!fs.existsSync(SchemaUtils.getPath({ root: vpath, fname: "root" }))) {
      await schemaModuleOpts2File(schema, vpath, "root");
    }

    if (!noAddToConfig) {
      await this.addVault({ ...opts, updateWorkspace: false });
    }
    if (opts.addToCodeWorkspace || opts.updateWorkspace) {
      await this.addVaultToCodeWorkspace(vault);
    }
    return vault;
  }

  /** Creates the given vault.
   *
   * @param vault Must be a self contained vault. Use
   * {@link VaultUtils.selfContained} to ensure this is correct, which will
   * allow the type to match.
   * @param addToConfig If true, the created vault will be added to the config
   * for the current workspace.
   * @param addToCodeWorkspace If true, the created vault will be added to the
   * `code-workspace` file for the current workspace.
   * @param newVault If true, the root note and schema files, and workspace
   * files will be created inside the vault.
   */
  async createSelfContainedVault(opts: {
    addToConfig?: boolean;
    addToCodeWorkspace?: boolean;
    // Must be created with a self-contained vault
    vault: SelfContainedVault;
    newVault: boolean;
  }) {
    const { vault, addToConfig, addToCodeWorkspace } = opts;
    /** The `vault` folder */
    const vaultPath = path.join(this.wsRoot, vault.fsPath);
    /** The `vault/notes` folder */
    const notesPath = path.join(vaultPath, FOLDERS.NOTES);
    // Create the folders we want for this vault.
    await fs.mkdirp(notesPath);
    await fs.mkdirp(path.join(notesPath, "assets"));

    if (opts.newVault) {
      // Create root note and schema
      const note = NoteUtils.createRoot({
        vault,
        body: ROOT_NOTE_TEMPLATE,
      });
      const schema = SchemaUtils.createRootModule({ vault });
      if (
        !(await fs.pathExists(
          NoteUtils.getFullPath({ note, wsRoot: this.wsRoot })
        ))
      ) {
        await note2File({ note, vault, wsRoot: this.wsRoot });
      }
      if (
        !(await fs.pathExists(
          SchemaUtils.getPath({ root: notesPath, fname: "root" })
        ))
      ) {
        await schemaModuleOpts2File(schema, notesPath, "root");
      }

      // Create the config and code-workspace for the vault, which make it self contained.
      // This is the config that goes inside the vault itself
      const selfContainedVaultConfig: DVault = {
        fsPath: ".",
        selfContained: true,
      };
      if (vault.name) selfContainedVaultConfig.name = vault.name;

      // create dendron.yml
      DConfig.createSync({
        wsRoot: vaultPath,
        defaults: {
          dev: {
            enableSelfContainedVaults: true,
          },
          workspace: {
            vaults: [selfContainedVaultConfig],
          },
        },
      });
      // create dendron.code-workspace
      WorkspaceConfig.write(vaultPath, [], {
        overrides: {
          folders: [
            {
              // Following how we set up workspace config for workspaces, where
              // the root is the `vault` directory
              path: "notes",
              name: VaultUtils.getName(vault),
            },
          ],
          settings: {
            // Also enable the self contained vault workspaces when inside the self contained vault
            [DENDRON_VSCODE_CONFIG_KEYS.ENABLE_SELF_CONTAINED_VAULTS_WORKSPACE]:
              true,
          },
        },
      });
      // Also add a gitignore, so files like `.dendron.port` are ignored if the
      // self contained vault is opened on its own
      await WorkspaceService.createGitIgnore(vaultPath);
    }

    // Update the config and code-workspace for the current workspace
    if (addToConfig) {
      await this.addVault({ ...opts, updateWorkspace: false });
    }
    if (addToCodeWorkspace) {
      await this.addVaultToCodeWorkspace(vault);
    }
    return vault;
  }

  async migrateVaultToSelfContained({ vault }: { vault: DVault }) {
    const backupInfix = "migrate-vault-sc";
    if (vault.seed) {
      // Unsupported vaults are filtered in the commands that use this function,
      // but also adding a sanity check here.
      throw new DendronError({
        message: "Seed vaults are not yet supported for automated migration.",
      });
    }
    const newVault: SelfContainedVault = {
      ..._.omit(vault, "workspace"),
      selfContained: true,
    };

    // This will be something like wsRoot/vault
    const oldFolder = vault2Path({ wsRoot: this.wsRoot, vault });
    // And this will be a subfolder like wsRoot/vault/notes
    const newFolder = vault2Path({ wsRoot: this.wsRoot, vault: newVault });
    await fs.ensureDir(newFolder);
    // Move all note files
    const noteFiles = await getAllFiles({
      root: URI.file(oldFolder),
      include: ["*.md"],
    });
    if (!noteFiles.data) {
      throw noteFiles.error;
    }
    await Promise.all(
      noteFiles.data.map(async (from) => {
        await fs.move(path.join(oldFolder, from), path.join(newFolder, from));
      })
    );
    // Move assets, if they exist
    await moveIfExists(
      path.join(oldFolder, FOLDERS.ASSETS),
      path.join(newFolder, FOLDERS.ASSETS)
    );
    // Update the config to mark this vault as self contained
    const config = DConfig.getRaw(this.wsRoot) as IntermediateDendronConfig;
    const configVault = ConfigUtils.getVaults(config).find((confVault) =>
      VaultUtils.isEqualV2(confVault, vault)
    );
    if (configVault) configVault.selfContained = true;

    // Update logoPath if needed
    let logoPath = config.publishing?.logoPath;
    if (
      // If the logo exists, and it was an asset inside the vault we're migrating
      config.publishing &&
      logoPath &&
      !isWebUri(logoPath) &&
      logoPath.startsWith(VaultUtils.getRelPath(vault))
    ) {
      // Then we need to update the logo path for the new path
      logoPath = logoPath.slice(VaultUtils.getRelPath(vault).length);
      logoPath = VaultUtils.getRelPath(newVault) + logoPath;
      config.publishing.logoPath = logoPath;
    }

    // All updates to the config are done, finish by writing it
    await DConfig.createBackup(this.wsRoot, backupInfix);
    await DConfig.writeConfig({ wsRoot: this.wsRoot, config });

    const workspaceService = new WorkspaceService({
      wsRoot: oldFolder,
    });

    const vaultConfig: SelfContainedVault = {
      // The config to be placed inside the vault, to function as a self contained vault
      ..._.omit(newVault, "remote"),
      fsPath: ".",
    };
    // Create or update the config file (dendron.yml) inside the wsRoot/vault
    if (
      !(await fs.pathExists(
        path.join(oldFolder, CONSTANTS.DENDRON_CONFIG_FILE)
      ))
    ) {
      // No existing config, so create new one
      await workspaceService.createSelfContainedVault({
        addToCodeWorkspace: false,
        addToConfig: true,
        vault: vaultConfig,
        newVault: true,
      });
    } else {
      // There's already a config file in the vault, update the existing one
      await DConfig.createBackup(oldFolder, backupInfix);
      const config = DConfig.getOrCreate(oldFolder);
      ConfigUtils.setVaults(config, [vaultConfig]);
      await DConfig.writeConfig({ wsRoot: oldFolder, config });
    }

    // Create or update the workspace file (dendron.code-workspace) inside the wsRoot/vault
    if (
      !(await fs.pathExists(path.join(oldFolder, CONSTANTS.DENDRON_WS_NAME)))
    ) {
      // No existing config, create a new one
      await workspaceService.createSelfContainedVault({
        addToCodeWorkspace: true,
        addToConfig: false,
        vault: vaultConfig,
        newVault: true,
      });
    } else {
      // There's already a config file in the vault, update the existing one
      await WorkspaceUtils.updateCodeWorkspaceSettings({
        wsRoot: oldFolder,
        updateCb: (settings) => {
          settings.folders = [
            {
              path: FOLDERS.NOTES,
              name: VaultUtils.getName(newVault),
            },
          ];
          return settings;
        },
      });
    }
    workspaceService.dispose();

    // Update the config for the vault
    return newVault;
  }

  markVaultAsRemoteInConfig(
    targetVault: DVault,
    remoteUrl: string
  ): Promise<void> {
    const config = this.config;
    const vaults = ConfigUtils.getVaults(config);
    ConfigUtils.setVaults(
      config,
      vaults.map((vault) => {
        if (VaultUtils.isEqualV2(vault, targetVault)) {
          vault.remote = { type: "git", url: remoteUrl };
        }
        return vault;
      })
    );
    return this.setConfig(config);
  }

  /** Converts a local vault to a remote vault, with `remoteUrl` as the upstream URL. */
  async convertVaultRemote({
    wsRoot,
    vault: targetVault,
    remoteUrl,
  }: {
    wsRoot: string;
    vault: DVault;
    remoteUrl: string;
  }) {
    // Now, initialize a repository in it
    const git = new Git({
      localUrl: path.join(wsRoot, targetVault.fsPath),
      remoteUrl,
    });
    if (!(await fs.pathExists(path.join(wsRoot, targetVault.fsPath, ".git")))) {
      // Avoid initializing if a git folder already exists
      await git.init();
    }
    let remote = await git.getRemote();
    if (!remote) {
      remote = await git.remoteAdd();
    } else {
      await git.remoteSet(remote);
    }
    const branch = await git.getCurrentBranch();
    // Add the contents of the vault and push to initialize the upstream
    await git.addAll();
    try {
      await git.commit({ msg: "Set up remote vault" });
    } catch (err: any) {
      // Ignore it if commit fails, it might happen if the vault if empty or if it was already a repo
      if (!_.isNumber(err?.exitCode)) throw err;
    }
    await git.push({ remote, branch });
    // Remove the vault folder from the tree of the root repository. Otherwise, the files will be there when
    // someone else pulls the root repo, which can break remote vault initialization. This doesn't delete the actual files.
    if (await fs.pathExists(path.join(wsRoot, ".git"))) {
      // But only if the workspace is in a git repository, otherwise skip this step.
      const rootGit = new Git({ localUrl: wsRoot });
      await rootGit.rm({
        cached: true,
        recursive: true,
        path: targetVault.fsPath,
      });
    }

    const config = this.config;
    ConfigUtils.updateVault(config, targetVault, (vault) => {
      vault.remote = {
        type: "git",
        url: remoteUrl,
      };
      return vault;
    });

    let ignorePath: string = targetVault.fsPath;
    if (config.dev?.enableSelfContainedVaults) {
      // Move vault folder to the correct location

      const newVaultPath = GitUtils.getDependencyPathWithRemote({
        vault: targetVault,
        remote: remoteUrl,
      });
      await fs.move(
        path.join(wsRoot, targetVault.fsPath),
        path.join(wsRoot, newVaultPath)
      );

      ConfigUtils.updateVault(config, targetVault, (vault) => {
        vault.fsPath = newVaultPath;
        return vault;
      });
      ignorePath = newVaultPath;
    }

    // Add the vault to the gitignore of root, so that it doesn't show up as part of root anymore
    await GitUtils.addToGitignore({
      addPath: ignorePath,
      root: wsRoot,
    });

    await this.setConfig(config);
    return { remote, branch };
  }

  /** Converts a remote vault to a local vault.
   *
   * If self contained vaults are enabled in the config, it will also move the
   * vault folder to `dependencies/localhost/`. It will not convert the vault
   * into a self contained vault however.
   */
  async convertVaultLocal({
    wsRoot,
    vault: targetVault,
  }: {
    wsRoot: string;
    vault: DVault;
  }) {
    // Remove vault from gitignore of root, if it's there, so it's part of root workspace again
    await GitUtils.removeFromGitignore({
      removePath: targetVault.fsPath,
      root: wsRoot,
    });

    // Remove the .git folder from the vault
    const gitFolder = path.join(wsRoot, targetVault.fsPath, ".git");
    await fs.rm(gitFolder, {
      recursive: true,
      force: true /* It's OK if dir doesn't exist */,
    });
    // Update `dendron.yml`, removing the remote from the converted vault
    const config = this.config;

    ConfigUtils.updateVault(config, targetVault, (vault) => {
      delete vault.remote;
      return vault;
    });

    if (config.dev?.enableSelfContainedVaults) {
      // Move vault folder to the correct location
      const newVaultPath = GitUtils.getDependencyPathWithRemote({
        vault: targetVault,
        remote: null,
      });
      await fs.move(
        path.join(wsRoot, targetVault.fsPath),
        path.join(wsRoot, newVaultPath)
      );

      ConfigUtils.updateVault(config, targetVault, (vault) => {
        vault.fsPath = newVaultPath;
        return vault;
      });
    }

    await this.setConfig(config);
  }

  /** For vaults in the same repository, ensure that their sync configurations do not conflict. Returns the coordinated sync config. */
  verifyVaultSyncConfigs(vaults: DVault[]): DVaultSync | undefined {
    let prevVault: DVault | undefined;
    for (const vault of vaults) {
      if (_.isUndefined(vault.sync)) continue;
      if (_.isUndefined(prevVault)) {
        prevVault = vault;
        continue;
      }
      if (prevVault.sync === vault.sync) continue;

      const prevVaultName = prevVault.name || prevVault.fsPath;
      const vaultName = vault.name || vault.fsPath;
      throw new DendronError({
        message: `Vaults ${prevVaultName} and ${vaultName} are in the same repository, but have conflicting configurations ${prevVault.sync} and ${vault.sync} set. Please remove conflicting configuration, or move vault to a different repository.`,
      });
    }
    return prevVault?.sync;
  }

  /** Checks if a given git command should be used on the vault based on user configuration.
   *
   * @param command The git command that we want to perform.
   * @param repo The location of the repository containing the vaults.
   * @param vaults The vaults on which the operation is being performed on.
   * @returns true if the command can be performed, false otherwise.
   */
  async shouldVaultsSync(
    command: "commit" | "push" | "pull",
    [root, vaults]: [string, DVault[]]
  ): Promise<boolean> {
    let workspaceVaultSyncConfig = this.verifyVaultSyncConfigs(vaults);
    if (_.isUndefined(workspaceVaultSyncConfig)) {
      if (await WorkspaceService.isWorkspaceVault(root)) {
        workspaceVaultSyncConfig = ConfigUtils.getWorkspace(this.config)
          .workspaceVaultSyncMode as DVaultSync;
        // default for workspace vaults
        if (_.isUndefined(workspaceVaultSyncConfig)) {
          workspaceVaultSyncConfig = DVaultSync.NO_COMMIT;
        }
      }
      // default for regular vaults
      else workspaceVaultSyncConfig = DVaultSync.SYNC;
    }

    if (workspaceVaultSyncConfig === DVaultSync.SKIP) return false;
    if (workspaceVaultSyncConfig === DVaultSync.SYNC) return true;
    if (
      workspaceVaultSyncConfig === DVaultSync.NO_COMMIT &&
      command === "commit"
    )
      return false;
    if (workspaceVaultSyncConfig === DVaultSync.NO_PUSH && command === "push")
      return false;
    return true;
  }

  private static async generateCommitMessage({
    vaults,
    engine,
  }: {
    vaults: DVault[];
    engine: DEngineClient;
  }): Promise<string> {
    const { version } = (await engine.info()).data || { version: "unknown" };

    return [
      "Dendron workspace sync",
      "",
      "## Synced vaults:",
      ...vaults.map((vault) => `- ${VaultUtils.getName(vault)}`),
      "",
      `Dendron version: ${version}`,
      `Hostname: ${os.hostname()}`,
    ].join("\n");
  }

  async getAllReposNumContributors() {
    const repos = await this.getAllRepos();
    const contributors = await Promise.all(
      repos.map((repo) => {
        const git = new Git({ localUrl: repo });
        try {
          return git.getNumContributors();
        } catch {
          return 0;
        }
      })
    );
    return contributors.filter(isNotUndefined);
  }

  async commitAndAddAll({
    engine,
  }: {
    engine: DEngineClient;
  }): Promise<SyncActionResult[]> {
    const allReposVaults = await this.getAllReposVaults();
    const out = await Promise.all(
      _.map(
        [...allReposVaults.entries()],
        async (rootVaults: [string, DVault[]]): Promise<SyncActionResult> => {
          const [repo, vaults] = rootVaults;
          const git = new Git({ localUrl: repo });
          if (!(await this.shouldVaultsSync("commit", rootVaults)))
            return { repo, vaults, status: SyncActionStatus.SKIP_CONFIG };
          if (await git.hasMergeConflicts())
            return { repo, vaults, status: SyncActionStatus.MERGE_CONFLICT };
          if (await git.hasRebaseInProgress()) {
            // try to resume the rebase first, since we know there are no merge conflicts
            return {
              repo,
              vaults,
              status: SyncActionStatus.REBASE_IN_PROGRESS,
            };
          }
          if (!(await git.hasChanges()))
            return { repo, vaults, status: SyncActionStatus.NO_CHANGES };
          try {
            await git.addAll();
            await git.commit({
              msg: await WorkspaceService.generateCommitMessage({
                vaults,
                engine,
              }),
            });
            return { repo, vaults, status: SyncActionStatus.DONE };
          } catch (err: any) {
            const stderr = err.stderr ? `: ${err.stderr}` : "";
            throw new DendronError({
              message: `error adding and committing vault${stderr}`,
              payload: { err, repoPath: repo },
            });
          }
        }
      )
    );
    return out;
  }

  /**
   * Initialize all remote vaults
   * @param opts
   * @returns
   */
  async initialize(opts?: { onSyncVaultsProgress: any; onSyncVaultsEnd: any }) {
    const { onSyncVaultsProgress, onSyncVaultsEnd } = _.defaults(opts, {
      onSyncVaultsProgress: () => {},
      onSyncVaultsEnd: () => {},
    });
    const initializeRemoteVaults = ConfigUtils.getWorkspace(
      this.config
    ).enableRemoteVaultInit;
    if (initializeRemoteVaults) {
      const { didClone } = await this.syncVaults({
        config: this.config,
        progressIndicator: onSyncVaultsProgress,
      });
      if (didClone) {
        onSyncVaultsEnd();
      }
      return didClone;
    }
    return false;
  }

  /**
   * Remove vaults. Currently doesn't delete any files.
   * @param param0
   */
  async removeVault(opts: { vault: DVault } & AddRemoveCommonOpts) {
    const { vault, updateConfig, updateWorkspace } = _.defaults(opts, {
      updateConfig: true,
      updateWorkspace: false,
    });

    // if we are updating the config, we should make sure
    // we don't include the local overrides
    const config = updateConfig
      ? DConfig.readConfigSync(this.wsRoot)
      : this.config;

    const vaults = ConfigUtils.getVaults(config);
    const vaultsAfterReject = _.reject(vaults, (ent: DVault) => {
      return (
        // Same vault, and
        VaultUtils.isEqualV2(ent, vault) &&
        // Either not a workspace vault, or the same workspace
        (!vault.workspace || ent.workspace === vault.workspace)
      );
    });
    ConfigUtils.setVaults(config, vaultsAfterReject);

    const workspaces = ConfigUtils.getWorkspace(config).workspaces;
    if (vault.workspace && workspaces) {
      const vaultWorkspace = _.find(ConfigUtils.getVaults(config), {
        workspace: vault.workspace,
      });
      if (_.isUndefined(vaultWorkspace)) {
        delete workspaces[vault.workspace];
        ConfigUtils.setWorkspaceProp(config, "workspaces", workspaces);
      }
    }
    const publishingConfig = ConfigUtils.getPublishingConfig(config);
    if (
      publishingConfig.duplicateNoteBehavior &&
      _.isArray(publishingConfig.duplicateNoteBehavior.payload)
    ) {
      const vaults = ConfigUtils.getVaults(config);
      if (vaults.length === 1) {
        // if there is only one vault left, remove duplicateNoteBehavior setting
        ConfigUtils.unsetDuplicateNoteBehavior(config);
      } else {
        // otherwise pull the removed vault from payload
        const updatedDuplicateNoteBehavior =
          publishingConfig.duplicateNoteBehavior;

        _.pull(
          updatedDuplicateNoteBehavior.payload as string[],
          VaultUtils.getName(vault)
        );

        ConfigUtils.setDuplicateNoteBehavior(
          config,
          updatedDuplicateNoteBehavior
        );
      }
    }
    if (updateConfig) {
      await this.setConfig(config);
    }

    const wsPath = path.join(this.wsRoot, DENDRON_WS_NAME);
    if (updateWorkspace && (await fs.pathExists(wsPath))) {
      let settings = (await readJSONWithComments(
        wsPath
      )) as unknown as WorkspaceSettings;
      const folders = _.reject(
        settings.folders,
        (ent) => ent.path === VaultUtils.getRelPath(vault)
      );
      settings = assignJSONWithComment({ folders }, settings);

      if (opts.onUpdatingWorkspace) {
        opts.onUpdatingWorkspace();
      }

      writeJSONWithCommentsSync(wsPath, settings);

      if (opts.onUpdatedWorkspace) {
        await opts.onUpdatedWorkspace();
      }
    } else {
      // Run the hooks even if not updating the workspace file (native workspace), because other code depends on it.
      if (opts.onUpdatingWorkspace) {
        opts.onUpdatingWorkspace();
      }
      if (opts.onUpdatedWorkspace) {
        await opts.onUpdatedWorkspace();
      }
    }
  }

  createConfig() {
    return WorkspaceService.getOrCreateConfig(this.wsRoot);
  }

  static async createGitIgnore(wsRoot: string) {
    const gitIgnore = path.join(wsRoot, ".gitignore");
    await fs.writeFile(
      gitIgnore,
      [
        "node_modules",
        ".dendron.*",
        "build",
        "seeds",
        ".next",
        "pods/service-connections",
      ].join("\n"),
      { encoding: "utf8" }
    );
  }

  /**
   * Initialize workspace with specified vaults
   * Files and folders created:
   * wsRoot/
   * - .gitignore
   * - dendron.yml
   * - {vaults}/
   *   - root.md
   *   - root.schema.yml
   *
   * NOTE: dendron.yml only gets created if you are adding a workspace...
   * @param opts
   */
  static async createWorkspace(opts: WorkspaceServiceCreateOpts) {
    if (opts.useSelfContainedVault) {
      return this.createSelfContainedVaultWorkspace(opts);
    } else {
      return this.createStandardWorkspace(opts);
    }
  }

  static async createStandardWorkspace(opts: WorkspaceServiceCreateOpts) {
    const { wsRoot, wsVault, additionalVaults } = _.defaults(opts, {
      additionalVaults: [],
    });
    // for a standard workspace, there is no difference btw a wsVault and any other vault
    const vaults: DVault[] = [wsVault, ...additionalVaults].filter(
      (v): v is DVault => !_.isUndefined(v)
    );
    const ws = new WorkspaceService({ wsRoot });
    fs.ensureDirSync(wsRoot);
    // this creates `dendron.yml`
    DConfig.createSync({
      wsRoot,
    });
    // add gitignore
    WorkspaceService.createGitIgnore(wsRoot);
    if (opts.createCodeWorkspace) {
      WorkspaceConfig.write(wsRoot, vaults);
    }
    await _.reduce(
      vaults,
      async (prev, vault) => {
        await prev;
        await ws.createVault({ vault });
        return;
      },
      Promise.resolve()
    );
    // check if this is the first workspace created
    if (_.isUndefined(MetadataService.instance().getMeta().firstWsInitialize)) {
      MetadataService.instance().setFirstWsInitialize();
    }
    return ws;
  }

  /** Given a standard vault, convert it into a self contained vault.
   *
   * The function **mutates** (modifies) the vault object. */
  static standardToSelfContainedVault(vault: DVault): SelfContainedVault {
    if (VaultUtils.isSelfContained(vault)) return vault;

    if (vault.remote?.url) {
      // Remote vault, calculate path based on the remote
      vault.fsPath = path.join(
        FOLDERS.DEPENDENCIES,
        GitUtils.remoteUrlToDependencyPath({
          vaultName: vault.name || basename(vault.fsPath),
          url: vault.remote.url,
        })
      );
    } else {
      // Local vault, calculate path for local deps
      vault.fsPath = path.join(
        FOLDERS.DEPENDENCIES,
        FOLDERS.LOCAL_DEPENDENCY,
        path.basename(vault.fsPath)
      );
    }

    vault.selfContained = true;
    // Cast required, because TypeScript doesn't recognize `selfContained` is always set to true
    return vault as SelfContainedVault;
  }

  /** Creates a new workspace where the workspace is a self contained vault.
   *
   * If the vaults passed to this function are not self contained vaults, they
   * will be converted to self contained vaults before being created. The vault
   * objects passed in are **mutated**.
   *
   * Further, the first vault given will be the self contained vault that is
   * used as the workspace root.
   */
  static async createSelfContainedVaultWorkspace(
    opts: WorkspaceServiceCreateOpts
  ) {
    const { wsRoot, additionalVaults, wsVault } = opts;
    const ws = new WorkspaceService({ wsRoot });

    // the `notes` folder in a self contained vault
    // treat it differently - we don't want to add it to config since this happens automatically
    if (wsVault) {
      if (wsVault.name === undefined) {
        wsVault.name = path.basename(wsRoot);
      }
      wsVault.fsPath = ".";
      wsVault.selfContained = true;
      await ws.createSelfContainedVault({
        vault: wsVault as SelfContainedVault,
        addToCodeWorkspace: false,
        addToConfig: false,
        newVault: true,
      });
    }

    // additional vaults
    if (additionalVaults) {
      // Mutate vault objects to convert them to self contained vaults. The
      // first vault will be skipped because the conversion is a no-op for
      // vaults that are already self contained.
      const selfContainedVaults = additionalVaults.map(
        WorkspaceService.standardToSelfContainedVault
      );
      // Needs to be done one at a time, otherwise config updates are racy
      await asyncLoopOneAtATime(selfContainedVaults, (vault) => {
        return ws.createSelfContainedVault({
          vault,
          addToCodeWorkspace: false,
          addToConfig: true,
          newVault: true,
        });
      });
    }
    // check if this is the first workspace created
    if (_.isUndefined(MetadataService.instance().getMeta().firstWsInitialize)) {
      MetadataService.instance().setFirstWsInitialize();
    }
    return ws;
  }

  static async createFromConfig(opts: { wsRoot: string }) {
    const { wsRoot } = opts;
    const config = DConfig.getOrCreate(wsRoot);
    const ws = new WorkspaceService({ wsRoot });
    const vaults = ConfigUtils.getVaults(config);
    await Promise.all(
      vaults.map(async (vault) => {
        return ws.cloneVaultWithAccessToken({ vault });
      })
    );
    ws.dispose();
    return;
  }

  async addVaultToCodeWorkspace(vault: DVault) {
    const wsRoot = this.wsRoot;

    // workspace file
    const wsPath = WorkspaceConfig.workspaceFile(wsRoot);
    let out: WorkspaceSettings;
    try {
      out = (await readJSONWithComments(
        wsPath
      )) as unknown as WorkspaceSettings;
    } catch (err: any) {
      // If the config file didn't exist, ignore the error
      if (err?.code === "ENOENT") return;
      throw err;
    }
    if (
      !_.find(out.folders, (ent) => ent.path === VaultUtils.getRelPath(vault))
    ) {
      const vault2Folder = VaultUtils.toWorkspaceFolder(vault);
      const folders = [vault2Folder].concat(out.folders);
      out = assignJSONWithComment({ folders }, out);
      await writeJSONWithComments(wsPath, out);
    }
    return;
  }

  /**
   * Used in createFromConfig
   */
  async cloneVaultWithAccessToken(opts: { vault: DVault }) {
    const { vault } = opts;
    if (!vault.remote || vault.remote.type !== "git") {
      throw new DendronError({ message: "cloning non-git vault" });
    }
    let remotePath = vault.remote.url;
    const localPath = vault2Path({ vault, wsRoot: this.wsRoot });
    const git = simpleGit();
    this.logger.info({ msg: "cloning", remotePath, localPath });
    const accessToken = process.env["GITHUB_ACCESS_TOKEN"];
    if (accessToken) {
      this.logger.info({ msg: "using access token" });
      remotePath = GitUtils.getGithubAccessTokenUrl({
        remotePath,
        accessToken,
      });
    }
    await git.clone(remotePath, localPath);
  }

  /**
   * Clone a vault from a remote source
   * @param opts.vault vaults field
   * @param opts.urlTransformer modify the git url
   */
  async cloneVault(opts: {
    vault: DVault;
    urlTransformer?: UrlTransformerFunc;
  }) {
    const { vault, urlTransformer } = _.defaults(opts, {
      urlTransformer: _.identity,
    });
    const wsRoot = this.wsRoot;
    if (!vault.remote || vault.remote.type !== "git") {
      throw new DendronError({
        message: "Internal error: cloning non-git vault",
      });
    }
    const repoPath = pathForVaultRoot({ vault, wsRoot });
    this.logger.info({ msg: "cloning", repoPath });
    const git = simpleGit({ baseDir: wsRoot });
    await git.clone(urlTransformer(vault.remote.url), repoPath);
    return repoPath;
  }

  async cloneWorkspace(opts: {
    wsName: string;
    workspace: DWorkspaceEntry;
    wsRoot: string;
    urlTransformer?: UrlTransformerFunc;
  }) {
    const { wsRoot, urlTransformer, workspace, wsName } = _.defaults(opts, {
      urlTransformer: _.identity,
    });
    const repoPath = path.join(wsRoot, wsName);
    const git = simpleGit({ baseDir: wsRoot });
    await git.clone(urlTransformer(workspace.remote.url), wsName);
    return repoPath;
  }

  async getVaultRepo(vault: DVault) {
    const vpath = pathForVaultRoot({ vault, wsRoot: this.wsRoot });
    return GitUtils.getGitRoot(vpath);
  }

  async getAllReposVaults(): Promise<Map<string, DVault[]>> {
    const reposVaults = new Map<string, DVault[]>();
    const vaults = ConfigUtils.getVaults(this.config);
    await Promise.all(
      vaults.map(async (vault) => {
        const repo = await this.getVaultRepo(vault);
        if (_.isUndefined(repo)) return;
        const vaultsForRepo = reposVaults.get(repo) || [];
        vaultsForRepo.push(vault);
        reposVaults.set(repo, vaultsForRepo);
      })
    );
    return reposVaults;
  }

  async getAllRepos() {
    return [...(await this.getAllReposVaults()).keys()];
  }

  async pullVault(opts: { vault: DVault }) {
    const { vault } = _.defaults(opts, {
      urlTransformer: _.identity,
    });
    const wsRoot = this.wsRoot;
    if (!vault.remote || vault.remote.type !== "git") {
      throw new DendronError({ message: "pulling non-git vault" });
    }
    const repoPath = vault2Path({ wsRoot, vault });
    this.logger.info({ msg: "pulling ", repoPath });
    const git = simpleGit({ baseDir: repoPath });
    await git.pull();
    return repoPath;
  }

  /** Returns the list of vaults that were attempted to be pulled, even if there was nothing to pull. */
  async pullVaults(): Promise<SyncActionResult[]> {
    const ctx = "pullVaults";
    const allReposVaults = await this.getAllReposVaults();
    const out = await Promise.all(
      _.map(
        [...allReposVaults.entries()],
        async (rootVaults: [string, DVault[]]): Promise<SyncActionResult> => {
          const [repo, vaults] = rootVaults;
          const makeResult = (status: SyncActionStatus) => {
            return {
              repo,
              vaults,
              status,
            };
          };

          const git = new Git({ localUrl: repo });
          // It's impossible to pull if there is no remote or upstream
          if (!(await git.hasRemote()))
            return makeResult(SyncActionStatus.NO_REMOTE);
          // If there's a merge conflict, then we can't continue
          if (await git.hasMergeConflicts())
            return makeResult(SyncActionStatus.MERGE_CONFLICT);
          // A rebase in progress means there's no upstream, so it needs to come first.
          if (await git.hasRebaseInProgress()) {
            return makeResult(SyncActionStatus.REBASE_IN_PROGRESS);
          }

          if (_.isUndefined(await git.getUpstream()))
            return makeResult(SyncActionStatus.NO_UPSTREAM);
          if (!(await git.hasAccessToRemote()))
            return makeResult(SyncActionStatus.BAD_REMOTE);
          // If the vault was configured not to pull, then skip it
          if (!(await this.shouldVaultsSync("pull", rootVaults)))
            return makeResult(SyncActionStatus.SKIP_CONFIG);

          // If there are tracked changes, we need to stash them to pull
          let stashed: string | undefined;
          if (await git.hasChanges({ untrackedFiles: "no" })) {
            try {
              stashed = await git.stashCreate();
              this.logger.info({ ctx, vaults, repo, stashed });
              // this shouldn't fail, but for safety's sake
              if (_.isEmpty(stashed) || !git.isValidStashCommit(stashed)) {
                throw new DendronError({
                  message: "unable to stash changes",
                  payload: { stashed },
                });
              }
              // stash create doesn't change the working directory, so we need to get rid of the tracked changes
              await git.reset("hard");
            } catch (err: any) {
              this.logger.error({
                ctx: "pullVaults",
                vaults,
                repo,
                err,
                stashed,
              });
              return makeResult(SyncActionStatus.CANT_STASH);
            }
          }
          try {
            await git.pull();
            if (stashed) {
              const restored = await git.stashApplyCommit(stashed);
              stashed = undefined;
              if (!restored)
                return makeResult(
                  SyncActionStatus.MERGE_CONFLICT_AFTER_RESTORE
                );
            }
            // pull went well, everything is in order. The finally block will restore any stashed changes.
            return makeResult(SyncActionStatus.DONE);
          } catch (err: any) {
            // Failed to pull, let's see why:
            if (
              (await git.hasMergeConflicts()) ||
              (await git.hasRebaseInProgress())
            ) {
              if (stashed) {
                // There was a merge conflict during the pull, and we have stashed changes.
                // We can't apply the stash in this state, so we'd lose the users changes.
                // Abort the rebase.
                await git.rebaseAbort();
                return makeResult(
                  SyncActionStatus.MERGE_CONFLICT_LOSES_CHANGES
                );
              } else {
                return makeResult(SyncActionStatus.MERGE_CONFLICT_AFTER_PULL);
              }
            } else {
              const stderr = err?.stderr || "";
              const vaultNames = vaults
                .map((vault) => VaultUtils.getName(vault))
                .join(",");
              throw new DendronError({
                message: `Failed to pull ${vaultNames}: ${stderr}`,
                payload: {
                  err,
                  vaults,
                  repo,
                  stashed,
                },
              });
            }
          } finally {
            // Try to restore changes if we stashed them, even if there were errors. We don't want to lose the users changes.
            if (stashed) {
              git.stashApplyCommit(stashed);
            }
          }
        }
      )
    );
    return out;
  }

  /** Returns the list of vaults that were attempted to be pushed, even if there was nothing to push. */
  async pushVaults(): Promise<SyncActionResult[]> {
    const allReposVaults = await this.getAllReposVaults();
    const out = await Promise.all(
      _.map(
        [...allReposVaults.entries()],
        async (rootVaults: [string, DVault[]]): Promise<SyncActionResult> => {
          const [repo, vaults] = rootVaults;
          const git = new Git({ localUrl: repo });
          const makeResult = (status: SyncActionStatus) => {
            return {
              repo,
              vaults,
              status,
            };
          };

          if (!(await this.shouldVaultsSync("push", rootVaults)))
            return makeResult(SyncActionStatus.SKIP_CONFIG);
          if (!(await git.hasRemote()))
            return { repo, vaults, status: SyncActionStatus.NO_REMOTE };
          // if there's a rebase in progress then there's no upstream, so it needs to come first
          if (await git.hasMergeConflicts()) {
            return makeResult(SyncActionStatus.MERGE_CONFLICT);
          }
          if (await git.hasRebaseInProgress()) {
            return makeResult(SyncActionStatus.REBASE_IN_PROGRESS);
          }
          const upstream = await git.getUpstream();
          if (_.isUndefined(upstream))
            return makeResult(SyncActionStatus.NO_UPSTREAM);
          if (!(await git.hasAccessToRemote()))
            return makeResult(SyncActionStatus.BAD_REMOTE);
          if (!(await git.hasPushableChanges(upstream)))
            return makeResult(SyncActionStatus.NO_CHANGES);
          if (!(await git.hasPushableRemote()))
            return makeResult(SyncActionStatus.UNPULLED_CHANGES);
          if (!_.every(_.map(vaults, this.user.canPushVault)))
            return makeResult(SyncActionStatus.NOT_PERMITTED);
          try {
            await git.push();
            return makeResult(SyncActionStatus.DONE);
          } catch (err: any) {
            const stderr = err.stderr ? `: ${err.stderr}` : "";
            throw new DendronError({
              message: `error pushing vault${stderr}`,
              payload: { err, repoPath: repo },
            });
          }
        }
      )
    );
    return out;
  }

  /**
   * Remove all vault caches in workspace
   */
  async removeVaultCaches() {
    const vaults = ConfigUtils.getVaults(this.config);
    await Promise.all(
      vaults.map((vault) => {
        return removeCache(vault2Path({ wsRoot: this.wsRoot, vault }));
      })
    );
  }

  /**
   * See if there's anythign we need to change with the configuration
   */
  async runMigrationsIfNecessary({
    forceUpgrade,
    workspaceInstallStatus,
    currentVersion,
    previousVersion,
    dendronConfig,
    wsConfig,
  }: {
    forceUpgrade?: boolean;
    workspaceInstallStatus: InstallStatus;
    currentVersion: string;
    previousVersion: string;
    dendronConfig: IntermediateDendronConfig;
    wsConfig?: WorkspaceSettings;
  }) {
    let changes: MigrationChangeSetStatus[] = [];

    if (
      MigrationService.shouldRunMigration({
        force: forceUpgrade,
        workspaceInstallStatus,
      })
    ) {
      changes = await MigrationService.applyMigrationRules({
        currentVersion,
        previousVersion,
        dendronConfig,
        wsConfig,
        wsService: this,
        logger: this.logger,
      });
      // if changes were made, use updated changes in subsequent configuration
      if (!_.isEmpty(changes)) {
        const { data } = _.last(changes)!;
        dendronConfig = data.dendronConfig;
      }
    }

    return changes;
  }

  /**
   * Check major version of configuration.
   * Because Dendron workspace relies on major version to be the same, we force a migration if that's not
   * the case
   */
  async runConfigMigrationIfNecessary({
    currentVersion,
    dendronConfig,
  }: {
    currentVersion: string;
    dendronConfig: IntermediateDendronConfig;
  }) {
    let changes: MigrationChangeSetStatus[] = [];
    if (dendronConfig.version !== CURRENT_CONFIG_VERSION) {
      // NOTE: this migration will create a `migration-config` backup file in the user's home directory
      changes = await MigrationService.applyMigrationRules({
        currentVersion,
        previousVersion: "0.83.0", // to force apply
        dendronConfig,
        wsService: this,
        logger: this.logger,
        migrations: [CONFIG_MIGRATIONS],
      });
      // if changes were made, use updated changes in subsequent configuration
      if (!_.isEmpty(changes)) {
        const { data } = _.last(changes)!;
        dendronConfig = data.dendronConfig;
      }
    }

    return changes;
  }

  /**
   * Make sure all vaults are present on file system
   * @param fetchAndPull for repositories that exist, should we also do a fetch? default: false
   * @param skipPrivate skip cloning and pulling of private vaults. default: false
   */
  async syncVaults(opts: {
    config: IntermediateDendronConfig;
    progressIndicator?: () => void;
    urlTransformer?: UrlTransformerFunc;
    fetchAndPull?: boolean;
    skipPrivate?: boolean;
  }) {
    const ctx = "syncVaults";
    const { config, progressIndicator, urlTransformer, fetchAndPull } =
      _.defaults(opts, { fetchAndPull: false, skipPrivate: false });
    const { wsRoot } = this;

    const workspaces = ConfigUtils.getWorkspace(config).workspaces;
    // check workspaces
    const workspacePaths: { wsPath: string; wsUrl: string }[] = (
      await Promise.all(
        _.map(workspaces, async (wsEntry, wsName) => {
          const wsPath = path.join(wsRoot, wsName);
          if (!(await fs.pathExists(wsPath))) {
            return {
              wsPath: await this.cloneWorkspace({
                wsName,
                workspace: wsEntry!,
                wsRoot,
              }),
              wsUrl: wsEntry!.remote.url,
            };
          }
          return;
        })
      )
    ).filter((ent) => !_.isUndefined(ent)) as {
      wsPath: string;
      wsUrl: string;
    }[];

    // const seedService = new SeedService({wsRoot});
    // check seeds
    const seeds = ConfigUtils.getWorkspace(config).seeds;
    const seedResults: { id: string; status: SyncActionStatus; data: any }[] =
      [];
    await Promise.all(
      _.map(seeds, async (entry: SeedEntry, id: string) => {
        if (!(await SeedUtils.exists({ id, wsRoot }))) {
          const resp = await this._seedService.info({ id });
          if (_.isUndefined(resp)) {
            seedResults.push({
              id,
              status: SyncActionStatus.ERROR,
              data: new DendronError({
                status: SyncActionStatus.ERROR,
                message: `seed ${id} does not exist in registry`,
              }),
            });
            return;
          }
          const spath = await this._seedService.cloneSeed({
            seed: resp,
            branch: entry.branch,
          });
          seedResults.push({
            id,
            status: SyncActionStatus.NEW,
            data: { spath },
          });
        }
        return undefined;
      })
    );

    // clone all missing vaults
    const vaults = ConfigUtils.getVaults(config);
    const emptyRemoteVaults = vaults.filter(
      (vault) =>
        !_.isUndefined(vault.remote) &&
        !fs.existsSync(path.join(wsRoot, vault.fsPath))
    );
    const didClone =
      !_.isEmpty(emptyRemoteVaults) ||
      !_.isEmpty(workspacePaths) ||
      !_.isUndefined(
        seedResults.find((ent) => ent.status === SyncActionStatus.NEW)
      );
    // if we added a workspace, we also add new vaults
    if (!_.isEmpty(workspacePaths)) {
      await this.setConfig(config);
    }
    if (progressIndicator && didClone) {
      progressIndicator();
    }
    await Promise.all(
      emptyRemoteVaults.map(async (vault) => {
        return this.cloneVault({ vault, urlTransformer });
      })
    );
    if (fetchAndPull) {
      const vaults = ConfigUtils.getVaults(config);
      const vaultsToFetch = _.difference(
        vaults.filter((vault) => !_.isUndefined(vault.remote)),
        emptyRemoteVaults
      );
      this.logger.info({ ctx, msg: "fetching vaults", vaultsToFetch });
      await Promise.all(
        vaultsToFetch.map(async (vault) => {
          return this.pullVault({ vault });
        })
      );
    }
    return { didClone };
  }

  writePort(port: number) {
    const wsRoot = this.wsRoot;
    // dendron-cli can overwrite port file. anything that needs the port should connect to `portFilePathExtension`
    const portFilePath = EngineUtils.getPortFilePathForWorkspace({ wsRoot });
    fs.writeFileSync(portFilePath, _.toString(port), { encoding: "utf8" });
  }

  getMeta(): WSMeta {
    const fpath = getWSMetaFilePath({ wsRoot: this.wsRoot });
    const meta = openWSMetaFile({ fpath });
    return meta;
  }

  writeMeta(opts: { version: string }) {
    const { version } = opts;
    const fpath = getWSMetaFilePath({ wsRoot: this.wsRoot });
    return writeWSMetaFile({
      fpath,
      data: {
        version,
        activationTime: Time.now().toMillis(),
      },
    });
  }
}
