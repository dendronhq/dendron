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

  constructor(public opts: { localUrl: string; remoteUrl?: string }) {}

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
    await execa.command([`git commit -m '${msg}'`].join(" "), {
      shell: true,
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

  async init() {
    await this._execute("git init");
  }

  async pull() {
    const { localUrl: cwd } = this.opts;
    await execa.command([`git pull --rebase`].join(" "), {
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

  async hasChanges() {
    const { stdout } = await this._execute("git status --short");
    return !_.isEmpty(stdout);
  }

  async hasRemote() {
    const { stdout } = await this._execute("git remote");
    return !_.isEmpty(stdout);
  }
}
