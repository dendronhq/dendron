import _ from "lodash";
import path from "path";
import { CONSTANTS } from "./constants";
import { DendronError } from "./error";
import { DVault, WorkspaceFolderRaw } from "./types";

export class VaultUtils {
  static getName(vault: DVault): string {
    if (vault.seed) {
      return vault.seed;
    }
    return vault.name || path.basename(vault.fsPath);
  }

  static isEqual(
    vaultSrc: DVault | string,
    vaultCmp: DVault | string,
    wsRoot: string
  ) {
    if (_.isString(vaultSrc)) {
      vaultSrc = { fsPath: vaultSrc };
    }
    if (_.isString(vaultCmp)) {
      vaultCmp = { fsPath: vaultCmp };
    }
    return (
      this.normVaultPath({ vault: vaultSrc, wsRoot }) ===
      this.normVaultPath({ vault: vaultCmp, wsRoot })
    );
  }

  static isEqualV2(vaultSrc: DVault, vaultCmp: DVault) {
    return VaultUtils.getRelPath(vaultSrc) === VaultUtils.getRelPath(vaultCmp);
  }

  /**
   * Path of vault relative to workspace root
   * @param vault
   * @returns
   */
  static getRelPath(vault: DVault) {
    if (vault.workspace) {
      return path.join(vault.workspace, vault.fsPath);
    }
    if (vault.seed) {
      return path.join("seeds", vault.seed, vault.fsPath);
    }
    return vault.fsPath;
  }

  static getVaultByName({
    vaults,
    vname,
  }: {
    vname: string;
    vaults: DVault[];
  }): DVault | undefined {
    const vault = _.find(vaults, (vault) => {
      return vname === VaultUtils.getName(vault);
    });
    return vault;
  }

  /**
   * Like {@link getVaultByName} except throw error if undefined
   * @param param0
   * @returns
   */
  static getVaultByNameOrThrow({
    vaults,
    vname,
  }: {
    vname: string;
    vaults: DVault[];
  }) {
    const vault = this.getVaultByName({ vaults, vname });
    if (!vault) {
      throw new DendronError({ message: `vault with name ${vname} not found` });
    }
    return vault;
  }

  /**
   * See if a dir path matches that of an existing vault
   * @param param0
   * @returns
   */
  static getVaultByDirPath({
    vaults,
    wsRoot,
    fsPath,
  }: {
    /**
     * Absolute or relative path to note
     */
    fsPath: string;
    wsRoot: string;
    vaults: DVault[];
  }) {
    const normPath = this.normPathByWsRoot({
      wsRoot,
      fsPath,
    });
    const vault = _.find(vaults, (ent) => {
      return normPath.startsWith(VaultUtils.getRelPath(ent));
    });
    if (!vault) {
      throw new DendronError({
        message: "no vault found",
        payload: { wsRoot, fsPath, vaults, normPath, msg: "no vault found" },
      });
    }
    return vault;
  }

  static getVaultByNotePath({
    vaults,
    wsRoot,
    fsPath,
  }: {
    /**
     * Absolute or relative path to note
     */
    fsPath: string;
    wsRoot: string;
    vaults: DVault[];
  }) {
    return this.getVaultByDirPath({
      vaults,
      wsRoot,
      fsPath: path.dirname(fsPath),
    });
  }

  /**
   * Match vault to vaults
   */
  static matchVault = (opts: {
    vault: DVault;
    vaults: DVault[];
    wsRoot: string;
  }) => {
    const { vault, vaults, wsRoot } = opts;
    const maybeMatch = _.filter(vaults, (v) => {
      return VaultUtils.isEqual(v, vault, wsRoot);
    });
    if (maybeMatch.length === 1) {
      return maybeMatch[0];
    } else {
      return false;
    }
  };

  /**
   * Match vault without using wsRoot
   * @param opts
   * @returns
   */
  static matchVaultV2 = (opts: { vault: DVault; vaults: DVault[] }) => {
    const { vault, vaults } = opts;
    const maybeMatch = _.filter(vaults, (v) => {
      return VaultUtils.isEqualV2(v, vault);
    });
    if (maybeMatch.length === 1) {
      return maybeMatch[0];
    } else {
      return false;
    }
  };

  /**
   * Vault path relative to root
   */
  static normVaultPath = (opts: { vault: DVault; wsRoot: string }) => {
    return path.isAbsolute(opts.vault.fsPath)
      ? path.relative(opts.wsRoot, VaultUtils.getRelPath(opts.vault))
      : VaultUtils.getRelPath(opts.vault);
  };

  /**
   * Get relative path to vault
   * @param opts
   * @returns
   */
  static normPathByWsRoot = (opts: { fsPath: string; wsRoot: string }) => {
    return path.relative(opts.wsRoot, opts.fsPath);
  };

  static toURIPrefix(vault: DVault) {
    return CONSTANTS.DENDRON_DELIMETER + VaultUtils.getName(vault);
  }

  static toWorkspaceFolder(vault: DVault): WorkspaceFolderRaw {
    const name = VaultUtils.getName(vault);
    const _path = VaultUtils.getRelPath(vault);
    return {
      path: _path,
      name: name === _path || path.basename(_path) === name ? undefined : name,
    };
  }
}
