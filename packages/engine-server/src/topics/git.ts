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
}
