import execa from "execa";
import fs from "fs-extra";
import _ from "lodash";
import { DendronError } from "packages/common-all/src/error";
import path from "path";
import { parse } from "url";

/**
 *  NOTICE: Lots of the Git code is obtained from https://github.com/KnisterPeter/vscode-github, licened under MIT
 */

/**
 * Work directly with git repositories
 */
export class Git {
  static async getRepo(fpath: string): Promise<any | false> {
    return fs.existsSync(path.join(fpath, ".git"));
  }

  static async createRepo(fpath: string, opts?: { initCommit: boolean }) {
    const { initCommit } = _.defaults(opts, { initCommit: false });
    fs.ensureDirSync(fpath);
    await execa("git", ["init"], {
      cwd: fpath,
    });
    const readmePath = path.join(fpath, "README.md");
    fs.ensureFileSync(readmePath);
    if (initCommit) {
      await execa("git", ["add", "."], {
        cwd: fpath,
      });
      await execa("git", ["commit", "-m", "initial commit"], {
        cwd: fpath,
      });
    }
    return;
  }

  constructor(public opts: { localUrl: string; remoteUrl?: string }) {}

  async isRepo(): Promise<boolean> {
    return Git.getRepo(this.opts.localUrl);
  }

  async client(gitArgs: string[]) {
    const { localUrl: cwd } = this.opts;
    const { stdout } = await execa("git", gitArgs, { cwd });
    return stdout;
  }

  private async execute(
    cmd: string,
    uri: string
  ): Promise<{ stdout: string; stderr: string }> {
    const [git, ...args] = cmd.split(" ");
    return execa(git, args, { cwd: uri });
  }

  async clone(destOverride?: string) {
    const { localUrl, remoteUrl } = this.opts;
    const cmdParts = ["git clone", remoteUrl];
    if (destOverride) {
      cmdParts.push(destOverride);
    }
    await execa.command(cmdParts.join(" "), {
      shell: true,
      cwd: localUrl,
    });
    return localUrl;
  }

  async addAll() {
    await execa.command(["git add ."].join(" "), {
      shell: true,
      cwd: this.opts.localUrl,
    });
  }

  async commit(opts: { msg: string }) {
    const { msg } = opts;
    const { localUrl: cwd } = this.opts;
    await execa.command([`git commit -m '${msg}'`].join(" "), {
      shell: true,
      cwd,
    });
  }

  async push() {
    const { localUrl: cwd } = this.opts;
    await execa.command([`git push`].join(" "), {
      shell: true,
      cwd,
    });
  }

  async getCommitUpTo(commit?: string) {
    const { localUrl: cwd } = this.opts;
    const suffix = commit ? [`${commit}..HEAD`] : [];
    console.log(suffix);
    const { stdout } = await execa(
      "git",
      [`log`, `--pretty=format:'%H'`].concat(suffix),
      { cwd }
    );
    return stdout
      .split("\n")
      .filter((ent) => !_.isEmpty(ent))
      .map((ent) => _.trim(ent));
  }

  async getCurrentFileURL(opts: {
    folderPath: string;
    fileName: string;
    startLine: number;
    endLine: number;
  }): Promise<string> {
    const { folderPath, fileName, startLine, endLine } = opts;
    const root = await this.getGitRoot(folderPath);
    const file = fileName.substring(root.length);
    const uri = this.getGithubFileUrl(folderPath, file, startLine, endLine);
    return uri;
  }

  async getGitRoot(uri: string): Promise<string> {
    const response = await this.execute("git rev-parse --show-toplevel", uri);
    return response.stdout.trim();
  }

  public async getGithubFileUrl(
    uri: string,
    file: string,
    line = 0,
    endLine = 0
  ): Promise<string> {
    const hostname = await this.getGitHostname(uri);
    const [owner, repo] = await this.getGitProviderOwnerAndRepository(uri);
    const branch = await this.getCurrentBranch(uri);
    const currentFile = file.replace(/^\//, "");
    return `https://${hostname}/${owner}/${repo}/blob/${branch}/${currentFile}#L${
      line + 1
    }:L${endLine + 1}`;
  }

  public async getGitHostname(uri: string): Promise<string> {
    return (await this.getGitProviderOwnerAndRepositoryFromGitConfig(uri))[1];
  }

  private async getGitProviderOwnerAndRepositoryFromGitConfig(
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
          msg: `Your configuration contains an invalid remoteName. You should probably use one of these:\n ${remotes.join(
            "\n"
          )}`,
        });
      }
      throw e;
    }
  }

  private async getRemoteName(uri: string): Promise<string> {
    const remoteName = await this.calculateRemoteName(uri);
    if (remoteName) {
      return remoteName;
    }
    // fallback to origin which is a sane default
    return "origin";
  }

  private async calculateRemoteName(uri: string): Promise<string | undefined> {
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

  public parseGitUrl(remote: string): string[] {
    // git protocol remotes, may be git@github:username/repo.git
    // or git://github/user/repo.git, domain names are not case-sensetive
    if (remote.startsWith("git@") || remote.startsWith("git://")) {
      return this.parseGitProviderUrl(remote);
    }

    return this.getGitProviderOwnerAndRepositoryFromHttpUrl(remote);
  }

  public parseGitProviderUrl(remote: string): string[] {
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

  private getGitProviderOwnerAndRepositoryFromHttpUrl(
    remote: string
  ): string[] {
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

  private async getRemoteNames(uri: string): Promise<string[]> {
    const remotes = (
      await this.execute(`git config --local --get-regexp "^remote.*.url"`, uri)
    ).stdout.trim();
    return remotes
      .split("\n")
      .map((line) => new RegExp("^remote.([^.]+).url.*").exec(line))
      .map((match) => match && match[1])
      .filter((name) => Boolean(name)) as string[];
  }

  public async getGitProviderOwnerAndRepository(
    uri: string
  ): Promise<string[]> {
    return (
      await this.getGitProviderOwnerAndRepositoryFromGitConfig(uri)
    ).slice(2, 4);
  }

  public async getCurrentBranch(uri: string): Promise<string | undefined> {
    const stdout = (await this.execute("git branch", uri)).stdout;
    const match = stdout.match(/^\* (.*)$/m);
    return match ? match[1] : undefined;
  }
}
