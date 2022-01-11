import {
  CONSTANTS,
  IntermediateDendronConfig,
  DendronError,
  DNodeUtils,
  DVault,
  DWorkspaceV2,
  getSlugger,
  isBlockAnchor,
  NoteProps,
  VaultUtils,
  WorkspaceFolderCode,
  WorkspaceOpts,
  WorkspaceType,
  ConfigUtils,
  isNotUndefined,
} from "@dendronhq/common-all";
import {
  findDownTo,
  findUpTo,
  genHash,
  uniqueOutermostFolders,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import { URI } from "vscode-uri";

export class WorkspaceUtils {
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
}
