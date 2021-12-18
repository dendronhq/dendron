import { VaultSelectionMode } from "./types";
import { getDWorkspace } from "../../workspace";
import { ConfigUtils } from "@dendronhq/common-all";
import * as _ from "lodash";

/**
 * Class responsible for keeping track of the desired mode for vault
 * selection.
 *
 * We want to start with the selection from configuration value
 * However, if the user has toggled the selection during the session
 * we want to at least respect their wishes during the session and use
 * the value that they have toggled to during the session.
 *
 * (V2: in the future we should highly consider modifying the configuration
 * value if the user has changed the toggle to persist users wishes across
 * the sessions without users having to modify the config yaml).
 * */
export class VaultSelectionModeKeeper {
  static deviatedFromConfig: boolean = false;
  static lastSetMode: VaultSelectionMode | undefined;

  /**
   * Function to record user set deviation from configuration of vault selection mode.
   * */
  public static detectDeviationFromConfig(mode: VaultSelectionMode) {
    const configMode = this.configVaultSelectionMode();

    if (mode === VaultSelectionMode.alwaysPrompt && configMode === "smart") {
      this.deviatedFromConfig = true;
    }

    if (mode === VaultSelectionMode.smart && configMode === "alwaysPrompt") {
      this.deviatedFromConfig = true;
    }

    this.lastSetMode = mode;
  }

  /**
   * Function to get the pressed/non-pressed value of the button that is responsible
   * for displaying whether always prompt mode is on.
   * */
  public static vaultButtonPressedInitialState({
    optionsOverride,
  }: {
    optionsOverride?: VaultSelectionMode;
  }) {
    // Respect the options, optional override if it exists.
    if (!_.isUndefined(optionsOverride)) {
      return optionsOverride === VaultSelectionMode.alwaysPrompt;
    }

    if (this.deviatedFromConfig) {
      return this.lastSetMode === VaultSelectionMode.alwaysPrompt;
    } else {
      return this.shouldAlwaysPromptByConfigValue();
    }
  }

  private static configVaultSelectionMode() {
    const ws = getDWorkspace();
    const lookupConfig = ConfigUtils.getCommands(ws.config).lookup;
    const noteLookupConfig = lookupConfig.note;
    const configMode = noteLookupConfig.selectVaultModeOnCreate;

    return configMode;
  }

  private static shouldAlwaysPromptByConfigValue() {
    return this.configVaultSelectionMode() === "alwaysPrompt";
  }
}
