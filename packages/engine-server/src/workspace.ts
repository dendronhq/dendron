import {
  CONSTANTS,
  DendronConfig,
  DendronError,
  DuplicateNoteAction,
  DUser,
  DUtils,
  DVault,
  DVaultVisibility,
  NoteUtils,
  SchemaUtils,
  Time,
  VaultUtils,
} from "@dendronhq/common-all";
import {
  createLogger,
  GitUtils,
  note2File,
  schemaModuleOpts2File,
  simpleGit,
  vault2Path,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { DConfig } from "./config";
import { Git } from "./topics/git";
import { getPortFilePath, getWSMetaFilePath, writeWSMetaFile } from "./utils";

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
   * Create vault files if it does not exist
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

    if (!fs.existsSync(NoteUtils.getPathV4({ note, wsRoot: this.wsRoot }))) {
      await note2File({ note, vault, wsRoot: this.wsRoot });
    }
    if (
      !fs.existsSync(SchemaUtils.getPath({ root: this.wsRoot, fname: "root" }))
    ) {
      await schemaModuleOpts2File(schema, vpath, "root");
    }

    if (!noAddToConfig) {
      const config = this.config;
      config.vaults.unshift(vault);
      // update dup note behavior
      if (!config.site.duplicateNoteBehavior) {
        config.site.duplicateNoteBehavior = {
          action: DuplicateNoteAction.USE_VAULT,
          payload: config.vaults.map((v) => VaultUtils.getName(v)),
        };
      } else if (_.isArray(config.site.duplicateNoteBehavior.payload)) {
        config.site.duplicateNoteBehavior.payload.push(
          VaultUtils.getName(vault)
        );
      }
      await this.setConfig(config);
    }
    return;
  }

  async commidAndAddAll() {
    const allRepos = await this.getAllRepos();
    const out = await Promise.all(
      allRepos.map(async (root) => {
        const git = new Git({ localUrl: root });
        if (await git.hasChanges()) {
          await git.addAll();
          await git.commit({ msg: "update" });
          return root;
        }
        return undefined;
      })
    );
    return _.filter(out, (ent) => !_.isUndefined(ent));
  }

  /**
   * Return if vaults have been cloned
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
    config.vaults = _.reject(config.vaults, { fsPath: vault.fsPath });

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
      throw new DendronError({ msg: "cloning non-git vault" });
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
      throw new DendronError({ msg: "cloning non-git vault" });
    }
    const repoPath = vault2Path({ wsRoot, vault });
    logger.info({ msg: "cloning", repoPath });
    const git = simpleGit({ baseDir: wsRoot });
    await git.clone(urlTransformer(vault.remote.url), repoPath);
    return repoPath;
  }

  async getAllRepos() {
    const vaults = this.config.vaults;
    const wsRoot = this.wsRoot;
    return _.uniq(
      await Promise.all(
        vaults.map(async (vault) => {
          const vpath = vault2Path({ vault, wsRoot });
          return GitUtils.getGitRoot(vpath);
        })
      )
    );
  }

  /**
   * Check if a path belongs to a workspace
   */
  isPathInWorkspace(fpath: string) {
    try {
      // check if selection comes from known vault
      VaultUtils.getVaultByNotePathV4({
        vaults: this.config.vaults,
        wsRoot: this.wsRoot,
        fsPath: fpath,
      });
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
      throw new DendronError({ msg: "pulling non-git vault" });
    }
    const repoPath = vault2Path({ wsRoot, vault });
    logger.info({ msg: "pulling ", repoPath });
    const git = simpleGit({ baseDir: repoPath });
    await git.pull();
    return repoPath;
  }

  async pullVaults() {
    const allRepos = await this.getAllRepos();
    const out = await Promise.all(
      allRepos.map(async (root) => {
        const git = new Git({ localUrl: root });
        if (await git.hasRemote()) {
          await git.pull();
        }
      })
    );
    return _.filter(out, (ent) => !_.isUndefined(ent));
  }

  async pushVaults() {
    const allRepos = await this.getAllRepos();
    const vaults = this.config.vaults;
    const wsRoot = this.wsRoot;
    const out = await Promise.all(
      allRepos.map(async (root) => {
        const git = new Git({ localUrl: root });
        if (WorkspaceService.isWorkspaceVault(root)) {
          return;
        }
        const vault = VaultUtils.getVaultByPath({
          vaults,
          wsRoot,
          fsPath: root,
        });
        if ((await git.hasRemote()) && this.user.canPushVault(vault)) {
          await git.push().catch((err) => {
            throw new DendronError({ payload: { err, repoPath: root } });
          });
        }
      })
    );
    return _.filter(out, (ent) => !_.isUndefined(ent));
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
    const {
      config,
      progressIndicator,
      urlTransformer,
      fetchAndPull,
      skipPrivate,
    } = _.defaults(opts, { fetchAndPull: false, skipPrivate: false });
    const { wsRoot } = this;

    // clone all missing vaults
    const emptyRemoteVaults = config.vaults.filter(
      (vault) =>
        !_.isUndefined(vault.remote) &&
        !fs.existsSync(vault2Path({ vault, wsRoot })) &&
        (skipPrivate ? vault.visibility !== DVaultVisibility.PRIVATE : true)
    );
    const didClone = !_.isEmpty(emptyRemoteVaults);
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
        config.vaults.filter(
          (vault) =>
            !_.isUndefined(vault.remote) &&
            (skipPrivate ? vault.visibility !== DVaultVisibility.PRIVATE : true)
        ),
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
