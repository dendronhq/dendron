import {
  CONSTANTS,
  DendronConfig,
  VaultUtils,
  WorkspaceFolderRaw,
  WorkspaceOpts,
  WorkspaceSettings,
} from "@dendronhq/common-all";
import { readYAML } from "@dendronhq/common-server";
import { AssertUtils } from "@dendronhq/common-test-utils";
import { DConfig, Git } from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";

export async function checkString(body: string, ...match: string[]) {
  expect(
    await AssertUtils.assertInString({
      body,
      match,
    })
  ).toBeTruthy();
}

export async function checkNotInString(body: string, ...nomatch: string[]) {
  expect(
    await AssertUtils.assertInString({
      body,
      nomatch,
    })
  ).toBeTruthy();
}

const getWorkspaceFolders = (wsRoot: string) => {
  const wsPath = path.join(wsRoot, CONSTANTS.DENDRON_WS_NAME);
  const settings = fs.readJSONSync(wsPath) as WorkspaceSettings;
  return _.toArray(settings.folders);
};

export function checkVaults(opts: WorkspaceOpts, expect: any) {
  const { wsRoot, vaults } = opts;
  const configPath = DConfig.configPath(opts.wsRoot);
  const config = readYAML(configPath) as DendronConfig;
  expect(_.sortBy(config.vaults, ["fsPath", "workspace"])).toEqual(vaults);
  const wsFolders = getWorkspaceFolders(wsRoot);
  expect(wsFolders).toEqual(
    vaults.map((ent) => {
      const out: WorkspaceFolderRaw = { path: VaultUtils.getRelPath(ent) };
      if (ent.name) {
        out.name = ent.name;
      }
      return out;
    })
  );
}

export class GitTestUtils {
  static async createRepoForWorkspace(wsRoot: string) {
    const git = new Git({ localUrl: wsRoot });
    await git.init();
    await git.add("dendron.yml");
    await git.commit({ msg: "init" });
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
    git.push({ remote: "origin", branch: await git.getCurrentBranch() });
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

  static async createRepoWithReadme(root: string) {
    const git = new Git({ localUrl: root });
    await git.init();
    const readmePath = path.join(root, "README.md");
    fs.ensureFileSync(readmePath);
    await git.add(".");
    await git.commit({ msg: "init" });
  }
}
