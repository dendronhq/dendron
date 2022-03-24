import {
  ConfigUtils,
  CONSTANTS,
  DendronError,
  DNodeUtils,
  DVault,
  DWorkspaceV2,
  ERROR_STATUS,
  getSlugger,
  IntermediateDendronConfig,
  isBlockAnchor,
  isNotUndefined,
  NoteProps,
  RespV3,
  VaultUtils,
  WorkspaceFolderCode,
  WorkspaceOpts,
  WorkspaceSettings,
  WorkspaceType,
} from "@dendronhq/common-all";
import {
  assignJSONWithComment,
  FileUtils,
  findDownTo,
  findUpTo,
  genHash,
  GitUtils,
  readJSONWithComments,
  readJSONWithCommentsSync,
  uniqueOutermostFolders,
  writeJSONWithComments,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { URI } from "vscode-uri";
import {
  SyncActionResult,
  SyncActionStatus,
} from "./workspaceServiceInterface";

export class WorkspaceUtils {
  static isWorkspaceConfig(val: any): val is WorkspaceSettings {
    if (_.isNull(val)) {
      return false;
    }
    return true;
  }

  static async getCodeWorkspaceSettings(
    wsRoot: string
  ): Promise<RespV3<WorkspaceSettings>> {
    const wsConfigPath = path.join(wsRoot, CONSTANTS.DENDRON_WS_NAME);
    const wsConfig = await readJSONWithComments(wsConfigPath);
    if (!this.isWorkspaceConfig(wsConfig)) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_CONFIG,
          message: `Bad or missing code-workspace file ${wsConfigPath}`,
        }),
      };
    } else {
      return {
        data: wsConfig,
      };
    }
  }

  static getCodeWorkspaceSettingsSync(
    wsRoot: string
  ): RespV3<WorkspaceSettings> {
    const wsConfigPath = path.join(wsRoot, CONSTANTS.DENDRON_WS_NAME);
    try {
      const wsConfig = readJSONWithCommentsSync(wsConfigPath);
      if (!this.isWorkspaceConfig(wsConfig)) {
        return {
          error: DendronError.createFromStatus({
            status: ERROR_STATUS.INVALID_CONFIG,
            message: `Bad code-workspace file ${wsConfigPath}`,
          }),
        };
      } else {
        return {
          data: wsConfig,
        };
      }
    } catch (err) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_CONFIG,
          message: `Missing code-workspace file ${wsConfigPath}`,
        }),
      };
    }
  }

  /** Finds the workspace type using the VSCode plugin workspace variables. */
  static async getWorkspaceType({
    workspaceFolders,
    workspaceFile,
  }: {
    workspaceFolders?: readonly WorkspaceFolderCode[];
    workspaceFile?: URI;
  }): Promise<WorkspaceType> {
    if (
      !_.isUndefined(workspaceFile) &&
      path.basename(workspaceFile.fsPath) === CONSTANTS.DENDRON_WS_NAME
    ) {
      return WorkspaceType.CODE;
    }
    if (!_.isUndefined(workspaceFolders)) {
      const rootFolder = await this.findWSRootsInWorkspaceFolders(
        workspaceFolders
      );
      if (!_.isEmpty(rootFolder)) return WorkspaceType.NATIVE;
    }
    return WorkspaceType.NONE;
  }

  /** Finds the workspace type by analyzing the given directory. Use if plugin is not available.
   * @returns WorkspaceType
   */
  static async getWorkspaceTypeFromDir(dir: string) {
    if (fs.pathExistsSync(path.join(dir, CONSTANTS.DENDRON_WS_NAME))) {
      return WorkspaceType.CODE;
    }
    const wsRoot = await findDownTo({
      base: dir,
      fname: CONSTANTS.DENDRON_CONFIG_FILE,
      returnDirPath: true,
    });
    if (!wsRoot) return WorkspaceType.NONE;
    if (fs.pathExistsSync(path.join(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE))) {
      return WorkspaceType.NATIVE;
    }
    return WorkspaceType.NONE;
  }

  static async updateCodeWorkspaceSettings({
    wsRoot,
    updateCb,
  }: {
    wsRoot: string;
    updateCb: (settings: WorkspaceSettings) => WorkspaceSettings;
  }) {
    const maybeSettings = WorkspaceUtils.getCodeWorkspaceSettingsSync(wsRoot);
    if (maybeSettings.error) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "no workspace file found",
      });
    }
    const settings = updateCb(maybeSettings.data);
    await this.writeCodeWorkspaceSettings({ wsRoot, settings });
    return settings;
  }

  static async writeCodeWorkspaceSettings({
    settings,
    wsRoot,
  }: {
    settings: WorkspaceSettings;
    wsRoot: string;
  }) {
    return writeJSONWithComments(
      path.join(wsRoot, "dendron.code-workspace"),
      settings
    );
  }

  /**
   * Find wsRoot if exists
   * @returns
   */
  static findWSRoot() {
    const cwd = process.cwd();
    const configPath = findUpTo({
      base: cwd,
      fname: "dendron.yml",
      maxLvl: 3,
      returnDirPath: true,
    });
    return configPath;
  }

  static async findWSRootsInWorkspaceFolders(
    workspaceFolders: readonly WorkspaceFolderCode[]
  ): Promise<string[]> {
    const folders = uniqueOutermostFolders(
      workspaceFolders.map((folder) => folder.uri.fsPath)
    );
    const dendronWorkspaceFolders = await Promise.all(
      folders.map((folder) =>
        findDownTo({
          base: folder,
          fname: CONSTANTS.DENDRON_CONFIG_FILE,
          returnDirPath: true,
        })
      )
    );
    return dendronWorkspaceFolders.filter(isNotUndefined);
  }

  /**
   * Check if a file is a dendron note (vs a regular file or something else entirely)
   */
  static async isDendronNote({
    wsRoot,
    vaults,
    fpath,
  }: { fpath: string } & WorkspaceOpts): Promise<boolean> {
    // check if we have markdown file
    if (!fpath.endsWith(".md")) {
      return false;
    }
    // if markdown file, check if it is in a dendron vault
    if (!WorkspaceUtils.isPathInWorkspace({ wsRoot, vaults, fpath })) {
      return false;
    }

    // if markdown file, does it have frontmatter? check for `---` at beginning of file
    return (
      (await FileUtils.matchFilePrefix({ fpath, prefix: "---" })).data || false
    );
  }

  static isNativeWorkspace(workspace: DWorkspaceV2) {
    return workspace.type === WorkspaceType.NATIVE;
  }

  /**
   * Check if path is in workspace
   * @returns
   */
  static isPathInWorkspace({
    wsRoot,
    vaults,
    fpath,
  }: { fpath: string } & WorkspaceOpts) {
    try {
      VaultUtils.getVaultByFilePath({
        vaults,
        wsRoot,
        fsPath: fpath,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Return true if contents of note is different from engine
   * @param param0
   * @returns
   */
  static noteContentChanged({
    content,
    note,
  }: {
    content: string;
    note: NoteProps;
  }) {
    const noteHash = genHash(content);
    if (_.isUndefined(note.contentHash)) {
      return true;
    }
    return noteHash !== note.contentHash;
  }

  /**
   * Generate url for given note or return `undefined` if no url is specified
   * @param opts
   *
   */
  static getNoteUrl(opts: {
    config: IntermediateDendronConfig;
    note: NoteProps;
    vault: DVault;
    urlRoot?: string;
    anchor?: string;
  }) {
    const { config, note, anchor, vault } = opts;
    let { urlRoot } = opts;
    const notePrefix = "notes";
    /**
     * set to true if index node, don't append id at the end
     */
    let isIndex: boolean = false;

    const seeds = ConfigUtils.getWorkspace(config).seeds;
    if (vault.seed) {
      if (seeds && seeds[vault.seed]) {
        const maybeSite = seeds[vault.seed]?.site;
        if (maybeSite) {
          urlRoot = maybeSite.url;
          if (!_.isUndefined(note)) {
            // if custom index is set, match against that, otherwise `root` is default index
            isIndex = maybeSite.index
              ? note.fname === maybeSite.index
              : DNodeUtils.isRoot(note);
          }
        }
      }
    }
    let root = "";
    if (!_.isUndefined(urlRoot)) {
      root = urlRoot;
    } else {
      // assume github
      throw new DendronError({ message: "not implemented" });
    }
    let link = isIndex ? root : [root, notePrefix, note.id + ".html"].join("/");

    if (anchor) {
      if (!isBlockAnchor(anchor)) {
        link += `#${getSlugger().slug(anchor)}`;
      } else {
        link += `#${anchor}`;
      }
    }
    return link;
  }

  /**
   * @param results
   * @returns number of repos that has Sync Action Status done.
   */
  static getCountForStatusDone(results: SyncActionResult[]): number {
    return this.count(results, SyncActionStatus.DONE);
  }

  static count(results: SyncActionResult[], status: SyncActionStatus) {
    return results.filter((result) => result.status === status).length;
  }

  /**
   *
   * @param results
   * @param status
   * @returns name of all the repos with status same as @param status.
   */
  static getFilteredRepoNames(
    results: SyncActionResult[],
    status: SyncActionStatus
  ): string[] {
    const matchingResults = results.filter(
      (result) => result.status === status
    );
    if (matchingResults.length === 0) return [];
    return matchingResults.map((result) => {
      // Display the vault names for info/error messages
      if (result.vaults.length === 1) {
        return VaultUtils.getName(result.vaults[0]);
      }
      // But if there's more than one vault in the repo, then use the repo path which is easier to interpret
      return result.repo;
    });
  }

  static async addVaultToWorkspace({
    vault,
    wsRoot,
  }: {
    vault: DVault;
    wsRoot: string;
  }) {
    const resp = await WorkspaceUtils.getCodeWorkspaceSettings(wsRoot);
    if (resp.error) {
      // If there is no workspace file, just skip updating it. The workspace
      // file is optional with self contained vaults.
      return;
    }
    let wsSettings = resp.data;

    if (
      !_.find(
        wsSettings.folders,
        (ent) => ent.path === VaultUtils.getRelPath(vault)
      )
    ) {
      const vault2Folder = VaultUtils.toWorkspaceFolder(vault);
      const folders = [vault2Folder].concat(wsSettings.folders);
      wsSettings = assignJSONWithComment({ folders }, wsSettings);
      await WorkspaceUtils.writeCodeWorkspaceSettings({
        settings: wsSettings,
        wsRoot,
      });
    }

    // check for .gitignore
    await GitUtils.addToGitignore({
      addPath: vault.fsPath,
      root: wsRoot,
      noCreateIfMissing: true,
    });

    const vaultDir = path.join(wsRoot, vault.fsPath);
    fs.ensureDir(vaultDir);
    await GitUtils.addToGitignore({
      addPath: ".dendron.cache.*",
      root: vaultDir,
    });
    return;
  }
}
