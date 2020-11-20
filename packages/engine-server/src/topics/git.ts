// import { DendronError } from "@dendronhq/common-all";
// import { findInParent } from "@dendronhq/common-server";
// import fs from "fs-extra";
// import _ from "lodash";
// import nodegit, { Repository } from "nodegit";
// import os from "os";
// import path from "path";
import execa from "execa";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

type GitOpts = {
  cwd: string;
};
export class GitV2 {
  static async clone(cmd: string, opts?: GitOpts) {
    const cmdParts = ["git clone", cmd];
    return await execa.command(cmdParts.join(" "), {
      shell: true,
      cwd: opts?.cwd,
    });
  }
}

export class Git {
  static async getRepo(fpath: string): Promise<any | false> {
    return fs.existsSync(path.join(fpath, ".git"));
  }

  static async createRepo(fpath: string, opts?: { initCommit: boolean }) {
    const { initCommit } = _.defaults(opts, { initCommit: false });
    fs.ensureDirSync(fpath);
    const cmd = ["git init"];
    await execa.command(cmd.join(" "), {
      shell: true,
      cwd: fpath,
    });
    const readmePath = path.join(fpath, "README.md");
    fs.ensureFileSync(readmePath);
    if (initCommit) {
      await execa.command(["git add ."].join(" "), {
        shell: true,
        cwd: fpath,
      });
      await execa.command(["git commit -m 'initial commit'"].join(" "), {
        shell: true,
        cwd: fpath,
      });
    }
    return;
  }

  constructor(public opts: { localUrl: string; remoteUrl?: string }) {}

  async isRepo(): Promise<boolean> {
    return Git.getRepo(this.opts.localUrl);
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
}
