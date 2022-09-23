import { URI, Utils } from "vscode-uri";
import { DVault } from "../types/DVault";
import { VaultUtils } from "../vault";

/** Returns the path to where the notes are stored inside the vault.
 *
 * For self contained vaults, this is the `notes` folder inside of the vault.
 * For other vault types, this is the root of the vault itself.
 *
 * If you always need the root of the vault, use {@link pathForVaultRoot} instead.
 */
export function vault2Path({ vault, wsRoot }: { vault: DVault; wsRoot: URI }) {
  return Utils.joinPath(wsRoot, VaultUtils.getRelPath(vault));
}
