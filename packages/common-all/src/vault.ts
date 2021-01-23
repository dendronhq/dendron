import _ from "lodash";
import path from "path";
import { DendronError } from "./error";
import { DVault } from "./typesv2";

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

  /**
   @deprecated
   */
  static getByVaultPath({
    wsRoot,
    vaults,
    vaultPath,
  }: {
    wsRoot: string;
    vaultPath: string;
    vaults: DVault[];
  }) {
    // get diname
    const vault = _.find(vaults, (ent) => {
      let cmp = path.isAbsolute(vaultPath)
        ? path.relative(wsRoot, vaultPath)
        : vaultPath;
      return ent.fsPath === cmp;
    });
    if (!vault) {
      throw new DendronError({ msg: "no vault found" });
    }
    return vault;
  }

  static getVaultByName({
    vaults,
    vname,
    throwOnMissing,
  }: {
    vname: string;
    vaults: DVault[];
    throwOnMissing?: boolean;
  }) {
    const vault = _.find(vaults, (vault) => {
      return vname === VaultUtils.getName(vault);
    });
    if (!vault && throwOnMissing) {
      throw new DendronError({ msg: `vault with name ${vname} not found` });
    }
    return vault;
  }

  static getVaultByNotePathV4({
    vaults,
    wsRoot,
    fsPath,
  }: {
    /**
     * Path to note
     */
    fsPath: string;
    wsRoot: string;
    vaults: DVault[];
  }) {
    const normPath = this.normPathByWsRoot({
      wsRoot,
      fsPath: path.dirname(fsPath),
    });
    const vault = _.find(vaults, { fsPath: normPath });
    if (!vault) {
      throw new DendronError({ msg: "no vault found" });
    }
    return vault;
  }

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

  static normPathByWsRoot = (opts: { fsPath: string; wsRoot: string }) => {
    return path.relative(opts.wsRoot, opts.fsPath);
  };
}
