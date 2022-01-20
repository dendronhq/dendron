import { VaultSelectionMode } from "./types";
import { ConfigUtils } from "@dendronhq/common-all";
import { ExtensionProvider } from "../../ExtensionProvider";

/**
 * Class responsible for proxying interaction with vault
 * selection mode configuration.
 * */
export class VaultSelectionModeConfigUtils {
  public static getVaultSelectionMode() {
    if (
      ConfigUtils.getCommands(ExtensionProvider.getDWorkspace().config).lookup
        .note.confirmVaultOnCreate
    ) {
      return this.toVaultSelectionMode(this.configVaultSelectionMode());
    } else {
      return VaultSelectionMode.smart;
    }
  }

  public static configVaultSelectionMode() {
    const ws = ExtensionProvider.getDWorkspace();
    const lookupConfig = ConfigUtils.getCommands(ws.config).lookup;
    const noteLookupConfig = lookupConfig.note;
    const configMode = noteLookupConfig.vaultSelectionModeOnCreate;

    return configMode;
  }

  public static shouldAlwaysPromptVaultSelection() {
    return this.configVaultSelectionMode() === "alwaysPrompt";
  }

  private static toVaultSelectionMode(configMode: "smart" | "alwaysPrompt") {
    switch (configMode) {
      case "smart":
        return VaultSelectionMode.smart;
      case "alwaysPrompt":
        return VaultSelectionMode.alwaysPrompt;
      default:
        return VaultSelectionMode.smart;
    }
  }
}
