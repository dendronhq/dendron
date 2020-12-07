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

  static getVaultByNotePathV4({
    vaults,
    fsPath,
  }: {
    /**
     * Path to note
     */
    fsPath: string;
    wsRoot: string;
    vaults: DVault[];
  }) {
    // get diname
    fsPath = path.dirname(fsPath);
    const vault = _.find(vaults, { fsPath });
    if (!vault) {
      throw new DendronError({ msg: "no vault found" });
    }
    return vault;
  }

  static normVaultPath = (opts: { vault: DVault; wsRoot: string }) => {
    return path.isAbsolute(opts.vault.fsPath)
      ? path.relative(opts.wsRoot, opts.vault.fsPath)
      : opts.vault.fsPath;
  };
}
