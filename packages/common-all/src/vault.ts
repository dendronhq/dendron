import { DVault } from "./typesv2";
import path from "path";
import _ from "lodash";
import { DendronError } from "../lib";

export class VaultUtils {
  static getName(vault: DVault): string {
    return vault.name || path.basename(vault.fsPath);
  }
  static getVaultByFsPath({
    vaults,
    fsPath,
  }: {
    fsPath: string;
    vaults: DVault[];
  }) {
    const vault = _.find(vaults, { fsPath });
    if (!vault) {
      throw new DendronError({ msg: "no vault found" });
    }
    return vault;
  }
}
