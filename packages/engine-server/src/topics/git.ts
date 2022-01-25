import execa from "execa";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

/**
 * Work directly with git repositories
 */
export class Git {
  static async getRepo(fpath: string): Promise<any | false> {
    return fs.existsSync(path.join(fpath, ".git"));
  }

  constructor(
    public opts: { localUrl: string; remoteUrl?: string; bare?: boolean }
  ) {}

  async _execute(cmd: string): Promise<{ stdout: string; stderr: string }> {
    const [git, ...args] = cmd.split(" ");
    return execa(git, args, { cwd: this.opts.localUrl });
  }

  async isRepo(): Promise<boolean> {
    return Git.getRepo(this.opts.localUrl);
  }

  async client(gitArgs: string[]) {
    const { localUrl: cwd } = this.opts;
    const { stdout } = await execa("git", gitArgs, { cwd });
    return stdout;
  }

  async commit(opts: { msg: string }) {
    const { msg } = opts;
    const { localUrl: cwd } = this.opts;
    await execa("git", ["commit", "-m", msg], {
      cwd,
    });
  }

  async add(args: string) {
    await this._execute(`git add ${args}`);
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

  /** Adds the `remoteUrl` set in the constructor as a remote. */
  async remoteAdd() {
    const { remoteUrl } = this.opts;
    const remoteName = "origin";
    await this._execute(`git remote add ${remoteName} ${remoteUrl}`);
    return remoteName;
  }

  async remoteSet(remoteName: string) {
    const { remoteUrl } = this.opts;
    await this._execute(`git remote set-url ${remoteName} ${remoteUrl}`);
  }

  async remoteGet(remoteName: string) {
    const { stdout } = await this._execute(`git remote get-url ${remoteName}`);
    return stdout.trim();
  }

  async init() {
    await this._execute(`git init${this.opts.bare ? " --bare" : ""}`);
  }

  /** Equivalent to `git branch`.
   *
   * @param opts.m Can be used to rename a branch. If `opts.m.oldBranch` is not provided, it's the current branch.
   */
  async branch(opts: { m?: { oldBranch?: string; newBranch: string } }) {
    const args = ["git", "branch"];
    if (opts.m) {
      args.push("-m");
      if (opts.m.oldBranch) args.push(opts.m.oldBranch);
      args.push(opts.m.newBranch);
    }
    await this._execute(args.join(" "));
  }

  /** Set the upstream (remote tracking) branch of `branch`.
   *
   * @param opts.branch The branch to configure, defaults to current branch.
   * @param opts.origin The remote that will be set as upstream.
   * @param opts.upstreamBranch The remote branch in `origin` that will be the upstream branch.
   */
  async setUpsteamTo(opts: {
    branch?: string;
    origin: string;
    upsteamBranch: string;
  }) {
    const args = ["git", "branch"];
    if (opts.branch) args.push(opts.branch);
    args.push(`${opts.origin}/${opts.upsteamBranch}`);
    await this._execute(args.join(" "));
  }

  async pull() {
    const { localUrl: cwd } = this.opts;
    await execa.command([`git pull --rebase`].join(" "), {
      shell: true,
      cwd,
    });
  }

  async push(setUpstream?: { remote: string; branch: string }) {
    const { localUrl: cwd } = this.opts;
    let setUpstremArg = "";
    if (setUpstream)
      setUpstremArg = ` --set-upstream ${setUpstream.remote} ${setUpstream.branch}`;
    await execa.command([`git push${setUpstremArg}`].join(" "), {
      shell: true,
      cwd,
    });
  }

  /** Creates a dangling stash commit without changing the index or working tree. */
  async stashCreate() {
    const { stdout } = await this._execute(`git stash create`);
    return stdout;
  }

  /** Confirms that the commit given (output of {@link Git.stashCreate}) is a valid commit. */
  async isValidStashCommit(commit: string): Promise<boolean> {
    try {
      const { localUrl: cwd } = this.opts;
      const { exitCode } = await execa.command(`git stash show ${commit}`, {
        cwd,
      });
      return exitCode === 0;
    } catch {
      // If we can't verify for some reason, just say it's invalid for safety. That way we won't attempt any destructive actions.
      return false;
    }
  }

  /** Applies a stash commit created by {@link Git.stashCreate}. */
  async stashApplyCommit(commit: string) {
    await this._execute(`git stash apply ${commit}`);
  }

  /** Same as `git reset`. If a parameter is passed, it's `git reset --soft` or `git reset --hard`. */
  async reset(resetType?: "soft" | "hard") {
    const typeFlag = resetType === undefined ? "" : `--${resetType}`;
    await this._execute(`git reset ${typeFlag}`);
  }

  // === extra commands

  async addAll() {
    await execa.command(["git add ."].join(" "), {
      shell: true,
      cwd: this.opts.localUrl,
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

  async getCurrentBranch() {
    const { localUrl: cwd } = this.opts;
    try {
      const { stdout } = await execa(
        "git",
        [`rev-parse`, `--abbrev-ref`, `HEAD`],
        {
          cwd,
        }
      );
      return stdout.trim();
    } catch (err) {
      // rev-parse fails if there are no commits, let's try a fallback in that case
      const { stdout } = await execa(
        "git",
        ["symbolic-ref", "-q", "--short", "HEAD"],
        {
          cwd,
        }
      );
      return stdout.trim();
    }
  }

  async hasChanges(opts?: { untrackedFiles?: "all" | "no" | "normal" }) {
    let untrackedFilesArg = "";
    if (opts && opts.untrackedFiles)
      untrackedFilesArg = ` --untracked-files=${opts.untrackedFiles}`;
    const { stdout } = await this._execute(
      `git status --porcelain${untrackedFilesArg}`
    );
    return !_.isEmpty(stdout);
  }

  async hasRemote() {
    const { stdout } = await this._execute("git remote");
    return !_.isEmpty(stdout);
  }

  /** Gets the upstream `origin/branch` the current branch is set up to push to, or `undefined` if it is not set up to push anywhere. */
  async getUpstream(): Promise<string | undefined> {
    try {
      const { stdout } = await this._execute(
        "git rev-parse --abbrev-ref @{upstream}"
      );
      return _.trim(stdout);
    } catch {
      return undefined;
    }
  }

  async getRemote(): Promise<string | undefined> {
    try {
      const { stdout } = await this._execute("git remote");
      const upstream = _.trim(stdout.split("\n")[0]);
      if (!upstream) return undefined;
      return upstream;
    } catch {
      return undefined;
    }
  }

  /**
   * @param nameOnly: If true, only return the file names. Otherwise the full diff including contents is returned.
   * @param oldCommit: The old identifier (e.g. commit, tag, branch) that we are diffing against.
   * @param newCommit: The new identifier (e.g. commit, tag, branch) that we are diffing from.
   */
  async diff({
    nameOnly,
    oldCommit,
    newCommit,
  }:
    | { nameOnly?: boolean; oldCommit: string; newCommit: string }
    | {
        nameOnly?: boolean;
        oldCommit: undefined;
        newCommit: undefined;
      }): Promise<string> {
    const nameOnlyOption = nameOnly ? "--name-only" : "";
    if (_.isUndefined(oldCommit)) oldCommit = "";
    if (_.isUndefined(newCommit)) newCommit = "";
    const { stdout } = await this._execute(
      `git diff ${nameOnlyOption} ${oldCommit} ${newCommit}`
    );
    return _.trim(stdout);
  }

  async rm(opts: {
    cached?: boolean;
    recursive?: boolean;
    force?: boolean;
    dryRun?: boolean;
    path: string;
  }) {
    const args: string[] = [];
    if (opts.cached) args.push("--cached");
    if (opts.recursive) args.push("-r");
    if (opts.force) args.push("--force");
    if (opts.dryRun) args.push("--dry-run");
    args.push("--", opts.path);

    return execa("git", args, { cwd: this.opts.localUrl });
  }
}
