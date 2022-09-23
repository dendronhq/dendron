import _ from "lodash";
import { URI, Utils } from "vscode-uri";
import { FOLDERS } from "./constants";
import { DVault } from "./types/DVault";
import { VaultUtils } from "./vault";

/**
 * This version is meant to use URI instead of string paths to make it work on
 * all FS environments. It also should not use 'path' to maximize OS
 * compatibility.
 */
export class VaultUtilsV2 {
  static getRelPathFragments(vault: DVault) {
    if (VaultUtils.isSelfContained(vault)) {
      // Return the path to the notes folder inside the vault. This is for
      // compatibility with existing code.
      return [vault.fsPath, FOLDERS.NOTES];
    }
    if (vault.workspace) {
      return [vault.workspace, vault.fsPath];
    }
    if (vault.seed) {
      return ["seeds", vault.seed, vault.fsPath];
    }
    return vault.fsPath;
  }

  // TODO: Add Tests
  /**
   * For a given file path, return which vault the file path is a part of, if any.
   * @param param0
   * @returns
   */
  static getVaultByFilePath({
    wsRoot,
    vaults,
    fsPath,
  }: {
    wsRoot: URI;
    fsPath: URI;
    vaults: DVault[];
  }): DVault | undefined {
    return _.find(vaults, (vault) => {
      const vaultPath = Utils.joinPath(
        wsRoot,
        ...VaultUtilsV2.getRelPathFragments(vault)
      ).fsPath;
      return fsPath.fsPath.startsWith(vaultPath);
    });
  }
}
