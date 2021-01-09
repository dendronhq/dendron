import {
  DendronConfig,
  DendronError,
  DUtils,
  DVault,
  NoteUtilsV2,
  SchemaUtilsV2,
  Time,
  WorkspaceUtilsCommon,
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

  public wsRoot: string;

  constructor({ wsRoot }: WorkspaceServiceOpts) {
    this.wsRoot = wsRoot;
  }

  get config(): DendronConfig {
    return DConfig.getOrCreate(this.wsRoot);
  }

  get configV2(): DendronConfig {
    return DConfig.getOrCreate(this.dendronRoot);
  }
  get dendronRoot(): string {
    return path.join(this.wsRoot, "dendron");
  }

  async setConfig(config: DendronConfig) {
    const wsRoot = this.wsRoot;
    return DConfig.writeConfig({ wsRoot, config });
  }

  async setConfigV2(config: DendronConfig) {
    const wsRoot = this.dendronRoot;
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

    const note = NoteUtilsV2.createRoot({
      vault,
      body: [
        "# Welcome to Dendron",
        "",
        `This is the root of your dendron vault. If you decide to publish your entire vault, this will be your landing page. You are free to customize any part of this page except the frontmatter on top. `,
      ].join("\n"),
    });
    const schema = SchemaUtilsV2.createRootModule({ vault });

    if (!fs.existsSync(NoteUtilsV2.getPathV4({ note, wsRoot: this.wsRoot }))) {
      await note2File({ note, vault, wsRoot: this.wsRoot });
    }
    if (
      !fs.existsSync(
        SchemaUtilsV2.getPath({ root: this.wsRoot, fname: "root" })
      )
    ) {
      await schemaModuleOpts2File(schema, vpath, "root");
    }

    if (!noAddToConfig) {
      const config = this.config;
      config.vaults.unshift(vault);
      await this.setConfig(config);
    }
    return;
  }

  /**
   * Not fully resolved vault
   */
  async createVaultV2({ vault }: { vault: DVault }) {
    const vaultFullPath = vault2Path({ vault, wsRoot: this.wsRoot });
    fs.ensureDirSync(vaultFullPath);
    const wsRoot = this.wsRoot;

    const note = NoteUtilsV2.createRoot({
      vault,
      body: [
        "# Welcome to Dendron",
        "",
        `This is the root of your dendron vault. If you decide to publish your entire vault, this will be your landing page. You are free to customize any part of this page except the frontmatter on top. `,
      ].join("\n"),
    });
    const schema = SchemaUtilsV2.createRootModule({ vault });
    const notePath = NoteUtilsV2.getPathV4({ note, wsRoot });
    if (!fs.existsSync(notePath)) {
      await note2File({ note, vault, wsRoot: this.wsRoot });
    }
    if (
      !fs.existsSync(
        SchemaUtilsV2.getPath({ root: this.wsRoot, fname: "root" })
      )
    ) {
      await schemaModuleOpts2File(schema, vaultFullPath, "root");
    }

    // update config
    const config = this.configV2;
    config.vaults.push(vault);
    await this.setConfigV2(config);
    return;
  }

  /**
   * Remove vaults. Currently doesn't delete any files
   * @param param0
   */
  async removeVault({ vault }: { vault: DVault }) {
    const config = this.config;
    config.vaults = _.reject(config.vaults, { fsPath: vault.fsPath });
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
    await Promise.all(
      vaults.map(async (vault) => {
        return ws.createVault({ vault });
      })
    );
    return ws;
  }

  static async createWorkspaceV2(opts: WorkspaceServiceCreateOpts) {
    const { wsRoot, vaults } = opts;
    const ws = new WorkspaceService({ wsRoot });
    fs.ensureDirSync(wsRoot);
    fs.ensureDirSync(ws.dendronRoot);
    await Promise.all(
      vaults.map(async (vault) => {
        return ws.createVaultV2({ vault });
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
        return ws.cloneVaultV2({ vault });
      })
    );
    return;
  }

  /**
   * Used in createFromConfig
   */
  async cloneVaultV2(opts: { vault: DVault }) {
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

  async cloneVault(opts: { vault: DVault }) {
    const { vault } = opts;
    const wsRoot = this.wsRoot;
    if (!vault.remote || vault.remote.type !== "git") {
      throw new DendronError({ msg: "cloning non-git vault" });
    }
    const repoPath = WorkspaceUtilsCommon.getPathForVault({ wsRoot, vault });
    const repoDir = WorkspaceUtilsCommon.getRepoDir(wsRoot);
    fs.ensureDirSync(repoDir);
    logger.info({ msg: "cloning", repoPath, repoDir });
    const git = simpleGit({ baseDir: repoDir });
    await git.clone(vault.remote.url);
    return repoPath;
  }

  writePort(port: number) {
    const wsRoot = this.wsRoot;
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
