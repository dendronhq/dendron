import { DVault, VaultUtils } from "@dendronhq/common-all";
import { getDWorkspace } from "./workspace";

/**
 * Wrapper around common-all VaultUtils which provides defaults
 * using the the current workspace accessible from the plugin. */
export class PluginVaultUtils {
  static getVaultByNotePath({
    vaults,
    wsRoot,
    fsPath,
  }: {
    /** Absolute or relative path to note  */
    fsPath: string;
    wsRoot?: string;
    vaults?: DVault[];
  }): DVault {
    if (!wsRoot) {
      wsRoot = getDWorkspace().wsRoot;
    }
    if (!vaults) {
      vaults = getDWorkspace().vaults;
    }

    return VaultUtils.getVaultByNotePath({
      vaults,
      wsRoot,
      fsPath,
    });
  }
}
