import { DVault, URI, VaultUtilsV2 } from "@dendronhq/common-all";
//TODO: Move file to common
/**
 * Check if path is in workspace
 * @returns
 */
export function isPathInWorkspace({
  wsRoot,
  vaults,
  fsPath,
}: {
  wsRoot: URI;
  fsPath: URI;
  vaults: DVault[];
}): boolean {
  return (
    VaultUtilsV2.getVaultByFilePath({ wsRoot, vaults, fsPath }) !== undefined
  );
}
