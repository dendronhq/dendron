import { VaultUtils } from "@dendronhq/common-all";
import { Git } from "@dendronhq/engine-server";
import fs from "fs-extra";
import path from "path";
import type { DVault } from "..";

export class GitTestUtils {
  static async createRepoForWorkspace(wsRoot: string) {
    const git = new Git({ localUrl: wsRoot });
    await git.init();
    await git.add("dendron.yml");
    await git.commit({ msg: "init" });
  }

  static async createRepoForVault({
    wsRoot,
    vault,
  }: {
    wsRoot: string;
    vault: DVault;
  }) {
    const localUrl = path.join(wsRoot, VaultUtils.getRelPath(vault));
    const git = new Git({ localUrl });
    await git.init();
    await git.add("root.md");
    await git.commit({ msg: "init" });
  }

  static hasChanges(wsRoot: string, opts: Parameters<Git["hasChanges"]>[0]) {
    const git = new Git({ localUrl: wsRoot });
    return git.hasChanges(opts);
  }

  /** Creates a "bare" git repository, to be used as the remote for a workspace.
   *
   * You'll probably want to just use `createRepoForRemoteWorkspace` instead, but this is provided if you are testing something it can't handle.
   */
  static async remoteCreate(remoteDir: string) {
    const git = new Git({ localUrl: remoteDir, bare: true });
    await git.init();
  }

  /** Adds a bare repository created with `createRemote` as the remote for the workspace.
   *
   * You'll probably want to just use `createRepoForRemoteWorkspace` instead, but this is provided if you are testing something it can't handle.
   */
  static async remoteAdd(wsRoot: string, remoteDir: string) {
    const git = new Git({ localUrl: wsRoot, remoteUrl: remoteDir });
    await git.remoteAdd();
    // Need to push to be able to set up remote tracking branch
    await git.push({ remote: "origin", branch: await git.getCurrentBranch() });
  }

  /** Set up a workspace with a remote, intended to be used when testing pull or push functionality.
   *
   * @param wsRoot Directory where the workspace will be stored.
   * @param remoteDir Directory where the remote will be stored. The workspace will pull and push to this remote.
   */
  static async createRepoForRemoteWorkspace(wsRoot: string, remoteDir: string) {
    await this.createRepoForWorkspace(wsRoot);
    await this.remoteCreate(remoteDir);
    await this.remoteAdd(wsRoot, remoteDir);
  }

  /** Set up a vault with a remote, intended to be used when testing pull or push functionality.
   *
   * @param wsRoot Directory where the vault exists.
   * @param remoteDir Directory where the remote will be stored. The vault will pull and push to this remote.
   */
  static async createRepoForRemoteVault({
    wsRoot,
    vault,
    remoteDir,
  }: {
    wsRoot: string;
    vault: DVault;
    remoteDir: string;
  }) {
    await this.createRepoForVault({ wsRoot, vault });
    await this.remoteCreate(remoteDir);
    await this.remoteAdd(
      path.join(wsRoot, VaultUtils.getRelPath(vault)),
      remoteDir
    );
  }

  /**
   * Convert existing workspace into a remote workspace
   * @param wsRoot Directory where the workspace will be stored.
   * @param remoteDir Directory where the remote will be stored. The workspace will pull and push to this remote.
   */
  static async addRepoToWorkspace(wsRoot: string) {
    const git = new Git({ localUrl: wsRoot });
    await git.init();
    await git.addAll();
    await git.commit({ msg: "init" });
  }

  /**
   * Create a git backed remote
   * /{root}
   *   - .git
   *   - README.md
   * @param root
   * @param opts
   */
  static async createRepoWithReadme(
    root: string,
    opts?: { remote?: boolean; branchName?: string }
  ) {
    const git = new Git({
      localUrl: root,
      remoteUrl: opts?.remote
        ? "git@github.com:dendronhq/dendron-site.git"
        : undefined,
    });
    await git.init();
    if (opts?.branchName) {
      await git.branch({ m: { newBranch: opts.branchName } });
    }
    const readmePath = path.join(root, "README.md");
    fs.ensureFileSync(readmePath);
    await git.add(".");
    await git.commit({ msg: "init" });
    if (opts?.remote) {
      await git.remoteAdd();
    }
  }
}
