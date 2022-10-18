import {
  CONSTANTS,
  DendronError,
  DVault,
  DWorkspace,
  NoteProps,
  ConfigUtils,
  GitUtils as CommonGitUtils,
  FOLDERS,
  DendronConfig,
} from "@dendronhq/common-all";
import execa from "execa";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import simpleGit, {
  SimpleGit,
  ResetMode as SimpleGitResetMode,
} from "simple-git";
import { parse } from "url";
import { readYAMLAsync } from ".";
import { vault2Path } from "./filesv2";

export { simpleGit, SimpleGit, SimpleGitResetMode };

/**
 *  NOTICE: Lots of the Git code is obtained from https://github.com/KnisterPeter/vscode-github, licened under MIT
 */

/**
 * Utilities for working with git urls
 */
export class GitUtils {
  static canShowGitLink(opts: { config: DendronConfig; note: NoteProps }) {
    return CommonGitUtils.canShowGitLink(opts);
  }
  static getGithubAccessTokenUrl(opts: {
    remotePath: string;
    accessToken: string;
  }) {
    return CommonGitUtils.getGithubAccessTokenUrl(opts);
  }

  static git2Github(gitUrl: string) {
    return CommonGitUtils.git2Github(gitUrl);
  }

  static getGithubEditUrl(opts: {
    note: NoteProps;
    config: DendronConfig;
    wsRoot: string;
  }) {
    return CommonGitUtils.getGithubEditUrl(opts);
  }

  static getOwnerAndRepoFromURL(url: string) {
    return CommonGitUtils.getOwnerAndRepoFromURL(url);
  }

  static getRepoNameFromURL(url: string) {
    return CommonGitUtils.getRepoNameFromURL(url);
  }

  public static remoteUrlToDependencyPath({
    vaultName,
    url,
  }: {
    vaultName: string;
    url?: string;
  }): string {
    return CommonGitUtils.remoteUrlToDependencyPath({ vaultName, url });
  }

  static getDependencyPathWithRemote({
    vault,
    remote,
  }: {
    remote: string | null;
    vault: DVault;
  }): string {
    return CommonGitUtils.getDependencyPathWithRemote({ vault, remote });
  }

  static getVaultFromRepo(opts: {
    repoPath: string;
    repoUrl: string;
    wsRoot: string;
  }): DVault {
    return CommonGitUtils.getVaultFromRepo(opts);
  }

  static async getVaultsFromRepo(opts: {
    repoPath: string;
    repoUrl: string;
    wsRoot: string;
  }): Promise<{ vaults: DVault[]; workspace?: DWorkspace }> {
    const { repoPath, wsRoot, repoUrl } = opts;
    // is workspace root
    if (
      // Has a config file
      (await fs.pathExists(
        path.join(repoPath, CONSTANTS.DENDRON_CONFIG_FILE)
      )) &&
      // But is not a self-contained vault
      !(await fs.pathExists(path.join(repoPath, FOLDERS.NOTES)))
    ) {
      const config = (await readYAMLAsync(
        path.join(repoPath, CONSTANTS.DENDRON_CONFIG_FILE)
      )) as DendronConfig;
      const workspace = path.basename(repoPath);
      const vaultsConfig = ConfigUtils.getVaults(config);
      const vaults = vaultsConfig.map((ent) => {
        const vpath = vault2Path({ vault: ent, wsRoot: repoPath });
        return {
          ...ent,
          workspace,
          fsPath: path.relative(path.join(wsRoot, workspace), vpath),
        };
      });
      return {
        workspace: {
          name: workspace,
          vaults,
          remote: {
            type: "git",
            url: repoUrl,
          },
        },
        vaults,
      };
    } else {
      const vault: DVault = {
        fsPath: path.relative(wsRoot, repoPath),
        remote: { type: "git", url: opts.repoUrl },
      };
      if (await fs.pathExists(path.join(repoPath, FOLDERS.NOTES))) {
        vault.selfContained = true;
      }
      return {
        vaults: [vault],
      };
    }
  }

  static isRepo(src: string) {
    return fs.existsSync(src) && fs.existsSync(path.join(src, ".git"));
  }

  static async getGitRoot(uri: string): Promise<string | undefined> {
    try {
      const response = await this.execute("git rev-parse --show-toplevel", uri);
      return response.stdout.trim();
    } catch (err: any) {
      // Not in a git repository
      if (err.failed) return undefined;
      throw err;
    }
  }

  static async getGithubFileUrl(
    uri: string,
    file: string,
    line = 0,
    endLine = 0
  ): Promise<string> {
    const hostname = await this.getGitHostname(uri);
    const [owner, repo] = await this.getGitProviderOwnerAndRepository(uri);
    const branch = await this.getCurrentBranch(uri);
    const currentFile = file.replace(/^\//, "").replace(/^\\/, "");
    return `https://${hostname}/${owner}/${repo}/blob/${branch}/${currentFile}#L${
      line + 1
    }:L${endLine + 1}`;
  }

  static async getGitHostname(uri: string): Promise<string> {
    return (await this.getGitProviderOwnerAndRepositoryFromGitConfig(uri))[1];
  }

  /**
   * Looks at URI for git repo
   * @param uri
   * @returns
   */
  static async getGitProviderOwnerAndRepositoryFromGitConfig(
    uri: string
  ): Promise<string[]> {
    const remoteName = await this.getRemoteName(uri);
    try {
      const remote = (
        await this.execute(
          `git config --local --get remote.${remoteName}.url`,
          uri
        )
      ).stdout.trim();
      if (!remote.length) {
        throw new Error("Git remote is empty!");
      }
      return this.parseGitUrl(remote);
    } catch (e) {
      const remotes = await this.getRemoteNames(uri);
      if (!remotes.includes(remoteName)) {
        throw new DendronError({
          message: `Your configuration contains an invalid remoteName. You should probably use one of these:\n ${remotes.join(
            "\n"
          )}`,
        });
      }
      throw e;
    }
  }

  static async getRemoteName(uri: string): Promise<string> {
    const remoteName = await this.calculateRemoteName(uri);
    if (remoteName) {
      return remoteName;
    }
    // fallback to origin which is a sane default
    return "origin";
  }

  static async calculateRemoteName(uri: string): Promise<string | undefined> {
    const ref = (
      await this.execute(`git symbolic-ref -q HEAD`, uri)
    ).stdout.trim();
    const upstreamName = (
      await this.execute(
        `git for-each-ref --format='%(upstream)' '${ref}'`,
        uri
      )
    ).stdout.trim();
    const match = upstreamName.match(/refs\/remotes\/([^/]+)\/.*/);
    if (match) {
      return match[1];
    }
    return undefined;
  }

  static parseGitUrl(remote: string): string[] {
    // git protocol remotes, may be git@github:username/repo.git
    // or git://github/user/repo.git, domain names are not case-sensetive
    if (remote.startsWith("git@") || remote.startsWith("git://")) {
      return this.parseGitProviderUrl(remote);
    }

    return this.getGitProviderOwnerAndRepositoryFromHttpUrl(remote);
  }

  static parseGitProviderUrl(remote: string): string[] {
    const match = new RegExp(
      "^git(?:@|://)([^:/]+)(?::|:/|/)([^/]+)/(.+?)(?:.git)?$",
      "i"
    ).exec(remote);
    if (!match) {
      throw new Error(
        `'${remote}' does not seem to be a valid git provider url.`
      );
    }
    return ["git:", ...match.slice(1, 4)];
  }

  static getGitProviderOwnerAndRepositoryFromHttpUrl(remote: string): string[] {
    // it must be http or https based remote
    const { protocol = "https:", hostname, pathname } = parse(remote);
    if (!protocol) {
      throw Error("impossible");
    }
    // domain names are not case-sensetive
    if (!hostname || !pathname) {
      throw new Error("Not a Provider remote!");
    }
    const match = pathname.match(/\/(.*?)\/(.*?)(?:.git)?$/);
    if (!match) {
      throw new Error("Not a Provider remote!");
    }
    return [protocol, hostname, ...match.slice(1, 3)];
  }

  static async getRemoteNames(uri: string): Promise<string[]> {
    const remotes = (
      await this.execute(`git config --local --get-regexp "^remote.*.url"`, uri)
    ).stdout.trim();
    return remotes
      .split("\n")
      .map((line) => new RegExp("^remote.([^.]+).url.*").exec(line))
      .map((match) => match && match[1])
      .filter((name) => Boolean(name)) as string[];
  }

  static async getGitProviderOwnerAndRepository(
    uri: string
  ): Promise<string[]> {
    return (
      await this.getGitProviderOwnerAndRepositoryFromGitConfig(uri)
    ).slice(2, 4);
  }

  static async getCurrentBranch(uri: string): Promise<string | undefined> {
    const stdout = (await this.execute("git branch", uri)).stdout;
    const match = stdout.match(/^\* (.*)$/m);
    return match ? match[1] : undefined;
  }

  static async execute(
    cmd: string,
    uri: string
  ): Promise<{ stdout: string; stderr: string }> {
    const [git, ...args] = cmd.split(" ");
    return execa(git, args, { cwd: uri });
  }

  /** Add a file or folder to the gitignore, avoiding creating exact duplicate lines.
   *
   * Creates the gitignore file if missing.
   *
   * @param addPath The path to add to the gitignore
   * @param root The root folder containing the `.gitignore` file.
   * @param noCreateIfMissing If true, `.gitignore` won't be created if it is missing
   */
  static async addToGitignore({
    addPath,
    root,
    noCreateIfMissing,
  }: {
    addPath: string;
    root: string;
    noCreateIfMissing?: boolean;
  }) {
    const gitignore = path.join(root, ".gitignore");
    let contents: string | undefined;
    try {
      contents = await fs.readFile(gitignore, { encoding: "utf-8" });
    } catch (err: any) {
      // if the .gitignore was missing, ignore it
      if (err?.code !== "ENOENT") throw err;
    }

    // gitignore is missing but we are allowed to create it
    const shouldCreate = contents === undefined && !noCreateIfMissing;

    // gitignore exists, and the path is not in it yet
    // Avoid duplicating the gitignore line if it was already there
    const pathExists =
      contents !== undefined &&
      contents.match(new RegExp(`^${_.escapeRegExp(addPath)}/?$`, "m"));

    if (shouldCreate || !pathExists) {
      await fs.appendFile(gitignore, `\n${addPath}`);
    }
  }

  /** Remove a file or folder from the gitignore.
   *
   * Does nothing if the gitignore is missing, or if the file or folder wasn't already in it.
   *
   * @param removePath The path to remove from the gitignore
   * @param root The root folder containing the `.gitignore` file.
   */
  static async removeFromGitignore({
    removePath,
    root,
  }: {
    removePath: string;
    root: string;
  }) {
    try {
      const gitignore = path.join(root, ".gitignore");
      const contents = await fs.readFile(gitignore, { encoding: "utf-8" });

      const newContents = contents.replace(
        new RegExp(`^${_.escapeRegExp(removePath)}/?$`, "m"),
        ""
      );
      if (newContents !== contents) await fs.writeFile(gitignore, newContents);
    } catch (err: any) {
      // Ignore it if the `.gitignore` was missing
      if (err?.code !== "ENOENT") throw err;
    }
  }

  /**
   *
   * @param uri
   * @param file
   * @returns codespaces url for the note
   */
  static async getCodeSpacesURL(uri: string, file: string): Promise<string> {
    const [owner, repo] = await this.getGitProviderOwnerAndRepository(uri);
    const branch = await this.getCurrentBranch(uri);
    const currentFile = file.replace(/^\//, "").replace(/^\\/, "");
    return `https://github.dev/${owner}/${repo}/blob/${branch}/${currentFile}`;
  }
}
