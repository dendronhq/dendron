import {
  CONSTANTS,
  DendronConfig,
  DendronError,
  DuplicateNoteAction,
  DUser,
  DUtils,
  DVault,
  DWorkspace,
  DWorkspaceEntry,
  NoteUtils,
  SchemaUtils,
  Time,
  VaultUtils,
  WorkspaceSettings,
} from "@dendronhq/common-all";
import {
  assignJSONWithComment,
  createLogger,
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
import { DConfig } from "./config";
import { Git } from "./topics/git";
import { getPortFilePath, getWSMetaFilePath, writeWSMetaFile } from "./utils";
const DENDRON_WS_NAME = CONSTANTS.DENDRON_WS_NAME;

const logger = createLogger();
export type PathExistBehavior = "delete" | "abort" | "continue";

export type WorkspaceServiceCreateOpts = {
  wsRoot: string;
  vaults: DVault[];
};

export type WorkspaceServiceOpts = {
  wsRoot: string;
};

type UrlTransformerFunc = (url: string) => string;

export class WorkspaceService {
  static isNewVersionGreater({
    oldVersion,
    newVersion,
  }: {
    oldVersion: string;
    newVersion: string;
  }) {
    return DUtils.semver.lt(oldVersion, newVersion);
  }

  static isWorkspaceVault(fpath: string) {
    return fs.existsSync(path.join(fpath, CONSTANTS.DENDRON_CONFIG_FILE));
  }

  public wsRoot: string;

  constructor({ wsRoot }: WorkspaceServiceOpts) {
    this.wsRoot = wsRoot;
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

  async setConfig(config: DendronConfig) {
    const wsRoot = this.wsRoot;
    return DConfig.writeConfig({ wsRoot, config });
  }

  /**
   *
   * @param param0
   * @returns `{vaults}` that have been added
   */
  async addWorkspace({ workspace }: { workspace: DWorkspace }) {
    const allWorkspaces = this.config.workspaces || {};
    allWorkspaces[workspace.name] = _.omit(workspace, ["name", "vaults"]);
    // update vault
    const newVaults = await _.reduce(
      workspace.vaults,
      async (acc, vault) => {
        const out = await acc;
        out.push(
          await this.addVault({
            vault: { ...vault, workspace: workspace.name },
          })
        );
        return out;
      },
      Promise.resolve([] as DVault[])
    );
    const config = this.config;
    config.workspaces = allWorkspaces;
    this.setConfig(config);
    return { vaults: newVaults };
  }

  async addVault(opts: {
    vault: DVault;
    config?: DendronConfig;
    writeConfig?: boolean;
    addToWorkspace?: boolean;
  }) {
    const { vault, config, writeConfig, addToWorkspace } = _.defaults(opts, {
      config: this.config,
      writeConfig: true,
      addToWorkspace: false,
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
    if (writeConfig) {
      await this.setConfig(config);
    }
    if (addToWorkspace) {
      const wsPath = path.join(this.wsRoot, DENDRON_WS_NAME);
      let out = (await readJSONWithComments(wsPath)) as WorkspaceSettings;
      if (
        !_.find(out.folders, (ent) => ent.path === VaultUtils.getRelPath(vault))
      ) {
        const vault2Folder = VaultUtils.toWorkspaceFolder(vault);
        const folders = [vault2Folder].concat(out.folders);
        out = assignJSONWithComment({ folders }, out);
        writeJSONWithComments(wsPath, out);
      }
    }
    return vault;
  }

  /**
   * Create vault files if it does not exist
   * @returns void
   *
   * Effects:
   *   - updates `dendron.yml` if `noAddToConfig` is not set
   *   - create directory
   *   - create root note and root schema
   */
  async createVault({
    vault,
    noAddToConfig,
  }: {
    vault: DVault;
    noAddToConfig?: boolean;
  }) {
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
      await this.addVault({ vault });
    }
    return;
  }

  shouldWorkspaceVaultSync(
    command: "commit" | "push" | "pull",
    vaultRoot: string
  ): boolean {
    if (!WorkspaceService.isWorkspaceVault(vaultRoot)) return true;
    let config = this.config.workspaceVaultSync;
    if (_.isUndefined(config)) config = "noPush"; // default
    if (config === "skip") return false;
    if (config === "sync") return true;
    if (config === "noCommit" && command === "commit") return false;
    if (config === "noPush" && command === "push") return false;
    return true;
  }

  async commidAndAddAll(): Promise<string[]> {
    const allRepos = await this.getAllRepos();
    const out = await Promise.all(
      allRepos.map(async (root) => {
        const git = new Git({ localUrl: root });
        if (!this.shouldWorkspaceVaultSync("commit", root)) return undefined;
        if (await git.hasChanges()) {
          await git.addAll();
          await git.commit({ msg: "update" });
          return root;
        }
        return undefined;
      })
    );
    return _.filter(out, (ent) => !_.isUndefined(ent)) as string[];
  }

  /**
   * Iintiaizlie all remote vaults
   * @param opts
   * @returns
   */
  async initialize(opts: { onSyncVaultsProgress: any; onSyncVaultsEnd: any }) {
    const { onSyncVaultsProgress, onSyncVaultsEnd } = opts;
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
   * Remove vaults. Currently doesn't delete any files
   * @param param0
   */
  async removeVault({ vault }: { vault: DVault }) {
    const config = this.config;
    config.vaults = _.reject(config.vaults, (ent) => {
      const checks = [ent.fsPath === vault.fsPath];
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
      if (config.vaults.length == 1) {
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
    await this.setConfig(config);
  }

  /**
   * Iinitialize workspace with root
   * @param opts
   */
  static async createWorkspace(opts: WorkspaceServiceCreateOpts) {
    const { wsRoot, vaults } = opts;
    const ws = new WorkspaceService({ wsRoot });
    fs.ensureDirSync(wsRoot);
    // add gitignore
    const gitIgnore = path.join(wsRoot, ".gitignore");
    fs.writeFileSync(
      gitIgnore,
      ["node_modules", ".dendron.*", "build", "\n"].join("\n"),
      { encoding: "utf8" }
    );
    await Promise.all(
      vaults.map(async (vault) => {
        return ws.createVault({ vault });
      })
    );
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
    logger.info({ msg: "cloning", remotePath, localPath });
    const accessToken = process.env["GITHUB_ACCESS_TOKEN"];
    if (accessToken) {
      logger.info({ msg: "using access token" });
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
    logger.info({ msg: "cloning", repoPath });
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

  async getAllRepos() {
    const vaults = this.config.vaults;
    return _.uniq(
      await Promise.all(
        vaults.map(async (vault) => {
          return await this.getVaultRepo(vault);
        })
      )
    ).filter((repo) => repo !== ""); // vaults that are not in repos will have this empty
  }

  getVaultForPath(fpath: string) {
    return VaultUtils.getVaultByNotePath({
      vaults: this.config.vaults,
      wsRoot: this.wsRoot,
      fsPath: fpath,
    });
  }

  /**
   * Check if a path belongs to a workspace
   */
  isPathInWorkspace(fpath: string) {
    try {
      // if not error, then okay
      this.getVaultForPath(fpath);
      return true;
    } catch {
      return false;
    }
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
    logger.info({ msg: "pulling ", repoPath });
    const git = simpleGit({ baseDir: repoPath });
    await git.pull();
    return repoPath;
  }

  /** Returns the list of vaults that were attempted to be pulled, even if there was nothing to pull. */
  async pullVaults(): Promise<string[]> {
    const allRepos = await this.getAllRepos();
    const out = await Promise.all(
      allRepos.map(async (root) => {
        const git = new Git({ localUrl: root });
        // It's impossible to pull if there is no remote, or if there are tracked files that have changes
        if (
          !(await git.hasRemote()) ||
          (await git.hasChanges({ untrackedFiles: "no" }))
        )
          return undefined;
        if (!this.shouldWorkspaceVaultSync("pull", root)) return undefined;
        try {
          await git.pull();
        } catch (err) {
          throw new DendronError({
            message: "error pulling vault",
            payload: { err, repoPath: root },
          });
        }
        return root;
      })
    );
    return _.filter(out, (ent) => !_.isUndefined(ent)) as string[];
  }

  /** Returns the list of vaults that were attempted to be pushed, even if there was nothing to push. */
  async pushVaults(): Promise<string[]> {
    const vaults = this.config.vaults;
    const out = await Promise.all(
      vaults.map(async (vault) => {
        const root = await this.getVaultRepo(vault);
        if (root === "") return undefined; // The vault is not in a repository
        const git = new Git({ localUrl: root });
        if (!(await git.hasRemote())) return undefined;
        if (!this.shouldWorkspaceVaultSync("push", root)) return undefined;
        if (this.user.canPushVault(vault)) {
          try {
            await git.push();
            return root;
          } catch (err) {
            throw new DendronError({
              message: "error pushing vault",
              payload: { err, repoPath: root },
            });
          }
        }
        return undefined;
      })
    );
    return _.filter(out, (ent) => !_.isUndefined(ent)) as string[];
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
    // const wsVaults: DVault[] = workspacePaths.flatMap(({ wsPath, wsUrl }) => {
    //   const { vaults } = GitUtils.getVaultsFromRepo({
    //     repoPath: wsPath,
    //     wsRoot,
    //     repoUrl: wsUrl,
    //   });
    //   return vaults;
    // });
    // add wsvaults
    // await Promise.all(wsVaults.map((vault) => {
    //   return this.addVault({ config, vault, writeConfig: false, addToWorkspace: true });
    // }));

    // clone all missing vaults
    const emptyRemoteVaults = config.vaults.filter(
      (vault) =>
        !_.isUndefined(vault.remote) &&
        !fs.existsSync(vault2Path({ vault, wsRoot }))
    );
    const didClone =
      !_.isEmpty(emptyRemoteVaults) || !_.isEmpty(workspacePaths);
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
      logger.info({ ctx, msg: "fetching vaults", vaultsToFetch });
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
