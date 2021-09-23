import {
  CONSTANTS,
  DendronConfig,
  DendronError,
  DuplicateNoteAction,
  DUser,
  DUtils,
  DVault,
  DVaultSync,
  DWorkspace,
  DWorkspaceEntry,
  InstallStatus,
  NoteUtils,
  SchemaUtils,
  SeedEntry,
  Time,
  VaultUtils,
  WorkspaceSettings,
} from "@dendronhq/common-all";
import {
  assignJSONWithComment,
  createLogger,
  DLogger,
  GitUtils,
  note2File,
  readJSONWithComments,
  schemaModuleOpts2File,
  simpleGit,
  vault2Path,
  writeJSONWithComments,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { DConfig } from "../config";
import { MetadataService } from "../metadata";
import { MigrationServce } from "../migrations";
import { SeedService, SeedUtils } from "../seed";
import { Git } from "../topics/git";
import {
  getPortFilePath,
  getWSMetaFilePath,
  removeCache,
  writeWSMetaFile,
} from "../utils";
import { WorkspaceUtils } from "./utils";
import { WorkspaceConfig } from "./vscode";
const DENDRON_WS_NAME = CONSTANTS.DENDRON_WS_NAME;

export type PathExistBehavior = "delete" | "abort" | "continue";

export enum SyncActionStatus {
  DONE = "",
  NO_CHANGES = "it has no changes",
  UNCOMMITTED_CHANGES = "it has uncommitted changes",
  NO_REMOTE = "it has no remote",
  NO_UPSTREAM = "the current branch has no upstream",
  SKIP_CONFIG = "it is configured so",
  NOT_PERMITTED = "user is not permitted to push to one or more vaults",
  NEW = "newly clond repository",
  ERROR = "error while syncing",
}

export type SyncActionResult = {
  repo: string;
  vaults: DVault[];
  status: SyncActionStatus;
};

export type WorkspaceServiceCreateOpts = {
  wsRoot: string;
  vaults?: DVault[];
  /**
   * create dendron.code-workspace file
   */
  createCodeWorkspace?: boolean;
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

export class WorkspaceService {
  public logger: DLogger;
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
    return fs.pathExists(path.join(fpath, CONSTANTS.DENDRON_CONFIG_FILE));
  }

  public wsRoot: string;

  constructor({ wsRoot, seedService }: WorkspaceServiceOpts) {
    this.wsRoot = wsRoot;
    this.logger = createLogger();
    this._seedService = seedService || new SeedService({ wsRoot });
  }

  get user(): DUser {
    const fpath = path.join(this.wsRoot, CONSTANTS.DENDRON_USER_FILE);
    if (fs.existsSync(fpath)) {
      return new DUser(_.trim(fs.readFileSync(fpath, { encoding: "utf8" })));
    } else {
      return DUser.createAnonymous();
    }
  }

  get config(): DendronConfig {
    return DConfig.defaults(DConfig.getOrCreate(this.wsRoot));
  }

  get dendronRoot(): string {
    return path.join(this.wsRoot, "dendron");
  }

  get seedService(): SeedService {
    return this._seedService;
  }

  async setConfig(config: DendronConfig) {
    const wsRoot = this.wsRoot;
    return DConfig.writeConfig({ wsRoot, config });
  }

  setWorkspaceConfig(config: WorkspaceSettings) {
    writeJSONWithComments(
      path.join(this.wsRoot, "dendron.code-workspace"),
      config
    );
  }

  /**
   *
   * @param param0
   * @returns `{vaults}` that have been added
   */
  async addWorkspace({ workspace }: { workspace: DWorkspace }) {
    const allWorkspaces = this.config.workspaces || {};
    allWorkspaces[workspace.name] = _.omit(workspace, ["name", "vaults"]);
    const config = this.config;
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
    config.workspaces = allWorkspaces;
    this.setConfig(config);
    return { vaults: newVaults };
  }

  /**
   *
   *
   * @param opts.vault - {@link DVault} to add to workspace
   * @param opts.config - if passed it, make modifications on passed in config instead of {wsRoot}/dendron.yml
   * @param opts.writeConfig - default: true, add to dendron.yml
   * @param opts.addToWorkspace - default: false, add to dendron.code-workspace
   * @returns
   */
  async addVault(
    opts: {
      vault: DVault;
      config?: DendronConfig;
    } & AddRemoveCommonOpts
  ) {
    const { vault, config, updateConfig, updateWorkspace } = _.defaults(opts, {
      config: this.config,
      updateConfig: true,
      updateWorkspace: false,
    });
    config.vaults.unshift(vault);
    // update dup note behavior
    if (!config.site.duplicateNoteBehavior) {
      config.site.duplicateNoteBehavior = {
        action: DuplicateNoteAction.USE_VAULT,
        payload: config.vaults.map((v) => VaultUtils.getName(v)),
      };
    } else if (_.isArray(config.site.duplicateNoteBehavior.payload)) {
      config.site.duplicateNoteBehavior.payload.push(VaultUtils.getName(vault));
    }
    if (updateConfig) {
      await this.setConfig(config);
    }
    if (updateWorkspace) {
      const wsPath = path.join(this.wsRoot, DENDRON_WS_NAME);
      let out = (await readJSONWithComments(wsPath)) as WorkspaceSettings;
      if (
        !_.find(out.folders, (ent) => ent.path === VaultUtils.getRelPath(vault))
      ) {
        const vault2Folder = VaultUtils.toWorkspaceFolder(vault);
        const folders = [vault2Folder].concat(out.folders);
        out = assignJSONWithComment({ folders }, out);

        if (opts.onUpdatingWorkspace) {
          await opts.onUpdatingWorkspace();
        }
        writeJSONWithComments(wsPath, out);

        if (opts.onUpdatedWorkspace) {
          await opts.onUpdatedWorkspace();
        }
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
    fs.ensureDirSync(vpath);

    const note = NoteUtils.createRoot({
      vault,
      body: [
        "# Welcome to Dendron",
        "",
        `This is the root of your dendron vault. If you decide to publish your entire vault, this will be your landing page. You are free to customize any part of this page except the frontmatter on top. `,
      ].join("\n"),
    });
    const schema = SchemaUtils.createRootModule({ vault });

    if (!fs.existsSync(NoteUtils.getFullPath({ note, wsRoot: this.wsRoot }))) {
      await note2File({ note, vault, wsRoot: this.wsRoot });
    }
    if (!fs.existsSync(SchemaUtils.getPath({ root: vpath, fname: "root" }))) {
      await schemaModuleOpts2File(schema, vpath, "root");
    }

    if (!noAddToConfig) {
      await this.addVault({ ...opts });
    }
    if (opts.addToCodeWorkspace) {
      await this.addVaultToCodeWorkspace(vault);
    }
    return vault;
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
    let config = this.verifyVaultSyncConfigs(vaults);
    if (_.isUndefined(config)) {
      if (await WorkspaceService.isWorkspaceVault(root)) {
        config = this.config.workspaceVaultSync;
        // default for workspace vaults
        if (_.isUndefined(config)) config = DVaultSync.NO_COMMIT;
      }
      // default for regular vaults
      else config = DVaultSync.SYNC;
    }

    if (config === DVaultSync.SKIP) return false;
    if (config === DVaultSync.SYNC) return true;
    if (config === DVaultSync.NO_COMMIT && command === "commit") return false;
    if (config === DVaultSync.NO_PUSH && command === "push") return false;
    return true;
  }

  async commitAndAddAll(): Promise<SyncActionResult[]> {
    const allReposVaults = await this.getAllReposVaults();
    const out = await Promise.all(
      _.map(
        [...allReposVaults.entries()],
        async (rootVaults: [string, DVault[]]): Promise<SyncActionResult> => {
          const [repo, vaults] = rootVaults;
          const git = new Git({ localUrl: repo });
          if (!(await this.shouldVaultsSync("commit", rootVaults)))
            return { repo, vaults, status: SyncActionStatus.SKIP_CONFIG };
          if (!(await git.hasChanges()))
            return { repo, vaults, status: SyncActionStatus.NO_CHANGES };
          try {
            await git.addAll();
            await git.commit({ msg: "update" });
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
    if (this.config.initializeRemoteVaults) {
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
    const config = this.config;
    const { vault, updateConfig, updateWorkspace } = _.defaults(opts, {
      updateConfig: true,
      updateWorkspace: false,
    });
    config.vaults = _.reject(config.vaults, (ent) => {
      const checks = [
        VaultUtils.getRelPath(ent) === VaultUtils.getRelPath(vault),
      ];
      if (vault.workspace) {
        checks.push(ent.workspace === vault.workspace);
      }
      return _.every(checks);
    });
    if (vault.workspace && config.workspaces) {
      const vaultWorkspace = _.find(config.vaults, {
        workspace: vault.workspace,
      });
      if (_.isUndefined(vaultWorkspace)) {
        delete config.workspaces[vault.workspace];
      }
    }
    if (
      config.site.duplicateNoteBehavior &&
      _.isArray(config.site.duplicateNoteBehavior.payload)
    ) {
      if (config.vaults.length === 1) {
        // if there is only one vault left, remove duplicateNoteBehavior setting
        config.site = _.omit(config.site, ["duplicateNoteBehavior"]);
      } else {
        // otherwise pull the removed vault from payload
        config.site.duplicateNoteBehavior.payload = _.pull(
          config.site.duplicateNoteBehavior.payload,
          vault.fsPath
        );
      }
    }
    if (updateConfig) {
      await this.setConfig(config);
    }
    if (updateWorkspace) {
      const wsPath = path.join(this.wsRoot, DENDRON_WS_NAME);
      let settings = (await readJSONWithComments(wsPath)) as WorkspaceSettings;
      const folders = _.reject(
        settings.folders,
        (ent) => ent.path === VaultUtils.getRelPath(vault)
      );
      settings = assignJSONWithComment({ folders }, settings);

      if (opts.onUpdatingWorkspace) {
        opts.onUpdatingWorkspace();
      }

      writeJSONWithComments(wsPath, settings);

      if (opts.onUpdatedWorkspace) {
        await opts.onUpdatedWorkspace();
      }
    }
  }

  createConfig() {
    this.config;
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
    const { wsRoot, vaults } = opts;
    const ws = new WorkspaceService({ wsRoot });
    fs.ensureDirSync(wsRoot);
    // this creates `dendron.yml`
    ws.createConfig();
    // add gitignore
    const gitIgnore = path.join(wsRoot, ".gitignore");
    fs.writeFileSync(
      gitIgnore,
      ["node_modules", ".dendron.*", "build", "\n"].join("\n"),
      { encoding: "utf8" }
    );
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

  static async createFromConfig(opts: { wsRoot: string }) {
    const { wsRoot } = opts;
    const config = DConfig.getOrCreate(wsRoot);
    const ws = new WorkspaceService({ wsRoot });
    await Promise.all(
      config.vaults.map(async (vault) => {
        return ws.cloneVaultWithAccessToken({ vault });
      })
    );
    return;
  }

  async addVaultToCodeWorkspace(vault: DVault) {
    const wsRoot = this.wsRoot;

    // workspace file
    const wsPath = WorkspaceConfig.workspaceFile(wsRoot);
    let out = (await readJSONWithComments(wsPath)) as WorkspaceSettings;
    if (
      !_.find(out.folders, (ent) => ent.path === VaultUtils.getRelPath(vault))
    ) {
      const vault2Folder = VaultUtils.toWorkspaceFolder(vault);
      const folders = [vault2Folder].concat(out.folders);
      out = assignJSONWithComment({ folders }, out);
      writeJSONWithComments(wsPath, out);
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
      throw new DendronError({ message: "cloning non-git vault" });
    }
    const repoPath = vault2Path({ wsRoot, vault });
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
    const vpath = vault2Path({ vault, wsRoot: this.wsRoot });
    return await GitUtils.getGitRoot(vpath);
  }

  async getAllReposVaults(): Promise<Map<string, DVault[]>> {
    const reposVaults = new Map<string, DVault[]>();
    await Promise.all(
      this.config.vaults.map(async (vault) => {
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

  /**
   * Check if a path belongs to a workspace
   @deprecated - use {@link WorkspaceUtils.isPathInWorkspace}
   */
  isPathInWorkspace(fpath: string) {
    const { vaults } = this.config;
    const wsRoot = this.wsRoot;
    return WorkspaceUtils.isPathInWorkspace({ fpath, vaults, wsRoot });
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
    const allReposVaults = await this.getAllReposVaults();
    const out = await Promise.all(
      _.map(
        [...allReposVaults.entries()],
        async (rootVaults: [string, DVault[]]): Promise<SyncActionResult> => {
          const [repo, vaults] = rootVaults;

          const git = new Git({ localUrl: repo });
          // It's impossible to pull if there is no remote, or if there are tracked files that have changes
          if (!(await git.hasRemote()))
            return { repo, vaults, status: SyncActionStatus.NO_REMOTE };
          if (_.isUndefined(await git.getUpstream()))
            return { repo, vaults, status: SyncActionStatus.NO_UPSTREAM };
          if (!(await this.shouldVaultsSync("pull", rootVaults)))
            return { repo, vaults, status: SyncActionStatus.SKIP_CONFIG };
          if (await git.hasChanges({ untrackedFiles: "no" }))
            return {
              repo,
              vaults,
              status: SyncActionStatus.UNCOMMITTED_CHANGES,
            };
          try {
            await git.pull();
            return { repo, vaults, status: SyncActionStatus.DONE };
          } catch (err: any) {
            const stderr = err.stderr ? `: ${err.stderr}` : "";
            throw new DendronError({
              message: `error pulling vault${stderr}`,
              payload: { err, repoPath: repo },
            });
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

          if (!(await git.hasRemote()))
            return { repo, vaults, status: SyncActionStatus.NO_REMOTE };
          const upstream = await git.getUpstream();
          if (_.isUndefined(upstream))
            return { repo, vaults, status: SyncActionStatus.NO_UPSTREAM };
          if (
            (await git.diff({
              nameOnly: true,
              oldCommit: upstream,
              newCommit: "HEAD",
            })) === ""
          )
            return { repo, vaults, status: SyncActionStatus.NO_CHANGES };
          if (!(await this.shouldVaultsSync("push", rootVaults)))
            return { repo, vaults, status: SyncActionStatus.SKIP_CONFIG };
          if (!_.every(_.map(vaults, this.user.canPushVault)))
            return { repo, vaults, status: SyncActionStatus.NOT_PERMITTED };
          try {
            await git.push();
            return { repo, vaults, status: SyncActionStatus.DONE };
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
    await Promise.all(
      this.config.vaults.map((vault) => {
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
    dendronConfig: DendronConfig;
    wsConfig: WorkspaceSettings;
  }) {
    // check if we need to force a migration
    try {
      const maybeRaw = DConfig.getRaw(this.wsRoot);
      if (_.isUndefined(maybeRaw.journal)) {
        forceUpgrade = true;
      }
    } catch (error) {
      this.logger.error(error);
    }

    if (
      MigrationServce.shouldRunMigration({
        force: forceUpgrade,
        workspaceInstallStatus,
      })
    ) {
      const changes = await MigrationServce.applyMigrationRules({
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
  }

  /**
   * Make sure all vaults are present on file system
   * @param fetchAndPull for repositories that exist, should we also do a fetch? default: false
   * @param skipPrivate skip cloning and pulling of private vaults. default: false
   */
  async syncVaults(opts: {
    config: DendronConfig;
    progressIndicator?: () => void;
    urlTransformer?: UrlTransformerFunc;
    fetchAndPull?: boolean;
    skipPrivate?: boolean;
  }) {
    const ctx = "syncVaults";
    const { config, progressIndicator, urlTransformer, fetchAndPull } =
      _.defaults(opts, { fetchAndPull: false, skipPrivate: false });
    const { wsRoot } = this;

    // check workspaces
    const workspacePaths: { wsPath: string; wsUrl: string }[] = (
      await Promise.all(
        _.map(config.workspaces, async (wsEntry, wsName) => {
          const wsPath = path.join(wsRoot, wsName);
          if (!fs.existsSync(wsPath)) {
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
    const seedResults: { id: string; status: SyncActionStatus; data: any }[] =
      [];
    await Promise.all(
      _.map(config.seeds, async (entry: SeedEntry, id: string) => {
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
    const emptyRemoteVaults = config.vaults.filter(
      (vault) =>
        !_.isUndefined(vault.remote) &&
        !fs.existsSync(vault2Path({ vault, wsRoot }))
    );
    const didClone =
      !_.isEmpty(emptyRemoteVaults) ||
      !_.isEmpty(workspacePaths) ||
      !_.isUndefined(
        seedResults.find((ent) => ent.status === SyncActionStatus.NEW)
      );
    // if we added a workspace, we also add new vaults
    if (!_.isEmpty(workspacePaths)) {
      this.setConfig(config);
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
      const vaultsToFetch = _.difference(
        config.vaults.filter((vault) => !_.isUndefined(vault.remote)),
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
    const portFilePath = getPortFilePath({ wsRoot });
    fs.writeFileSync(portFilePath, _.toString(port), { encoding: "utf8" });
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
