import { DVault, VaultUtils } from "@dendronhq/common-all";
import { ExtensionProvider } from "./ExtensionProvider";

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
      wsRoot = ExtensionProvider.getDWorkspace().wsRoot;
    }
    if (!vaults) {
      vaults = ExtensionProvider.getDWorkspace().vaults;
    }

    return VaultUtils.getVaultByFilePath({
      vaults,
      wsRoot,
      fsPath,
    });
  }
}
