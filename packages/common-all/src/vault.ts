import _ from "lodash";
import path from "path";
import { CONSTANTS } from "./constants";
import { DendronError } from "./error";
import { DVault } from "./types";

export class VaultUtils {
  static getName(vault: DVault): string {
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

  static getVaultByName({
    vaults,
    vname,
  }: {
    vname: string;
    vaults: DVault[];
  }) {
    const vault = _.find(vaults, (vault) => {
      return vname === VaultUtils.getName(vault);
    });
    return vault;
  }

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

  static getVaultByPath({
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
    const vault = _.find(vaults, { fsPath: normPath });
    if (!vault) {
      throw new DendronError({
        payload: { wsRoot, fsPath, vaults, normPath, msg: "no vault found" },
      });
    }
    return vault;
  }

  static getVaultByNotePathV4({
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
    return this.getVaultByPath({
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
   * Vault path relative to root
   */
  static normVaultPath = (opts: { vault: DVault; wsRoot: string }) => {
    return path.isAbsolute(opts.vault.fsPath)
      ? path.relative(opts.wsRoot, opts.vault.fsPath)
      : opts.vault.fsPath;
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
    return {
      path: vault.fsPath,
      name: vault.name,
    };
  }
}
export type WorkspaceFolderRaw = {
  path: string;
  name?: string;
};
