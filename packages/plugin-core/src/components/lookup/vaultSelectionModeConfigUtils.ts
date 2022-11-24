import { VaultSelectionMode } from "./types";
import { ConfigUtils } from "@dendronhq/common-all";
import { ExtensionProvider } from "../../ExtensionProvider";

/**
 * Class responsible for proxying interaction with vault
 * selection mode configuration.
 * */
export class VaultSelectionModeConfigUtils {
  public static async getVaultSelectionMode() {
    if (
      ConfigUtils.getCommands(await ExtensionProvider.getDWorkspace().config)
        .lookup.note.confirmVaultOnCreate
    ) {
      return this.toVaultSelectionMode(await this.configVaultSelectionMode());
    } else {
      return VaultSelectionMode.smart;
    }
  }

  public static async configVaultSelectionMode() {
    const ws = ExtensionProvider.getDWorkspace();
    const lookupConfig = ConfigUtils.getCommands(await ws.config).lookup;
    const noteLookupConfig = lookupConfig.note;
    const configMode = noteLookupConfig.vaultSelectionModeOnCreate;

    return configMode;
  }

  public static async shouldAlwaysPromptVaultSelection() {
    return (await this.configVaultSelectionMode()) === "alwaysPrompt";
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
