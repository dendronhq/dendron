import {
  ConfigEvents,
  ConfigUtils,
  ConfirmStatus,
  InstallStatus,
} from "@dendronhq/common-all";
import { DConfig, DoctorActionsEnum } from "@dendronhq/engine-server";
import { IDendronExtension } from "../dendronExtensionInterface";
import { AnalyticsUtils } from "./analytics";
import * as vscode from "vscode";
import { DoctorCommand } from "../commands/Doctor";

export class StartupUtils {
  static shouldDisplayMissingDefaultConfigMessage(opts: {
    ext: IDendronExtension;
    extensionInstallStatus: InstallStatus;
  }): boolean {
    if (opts.extensionInstallStatus === InstallStatus.UPGRADED) {
      const wsRoot = opts.ext.getDWorkspace().wsRoot;
      const rawConfig = DConfig.getRaw(wsRoot);
      const out = ConfigUtils.detectMissingDefaults({ config: rawConfig });
      return out !== undefined && out.needsBackfill;
    } else {
      return false;
    }
  }

  static showMissingDefaultConfigMessage(opts: { ext: IDendronExtension }) {
    AnalyticsUtils.track(ConfigEvents.ShowMissingDefaultConfigMessage);
    const ADD_CONFIG = "Add Missing Configuration";
    const MESSAGE =
      "We have detected a missing configuration. This may happen because a new configuration was introduced, or because an existing required configuration has been deleted. Would you like to add them to dendron.yml?";
    vscode.window
      .showInformationMessage(MESSAGE, ADD_CONFIG)
      .then(async (resp) => {
        if (resp === ADD_CONFIG) {
          AnalyticsUtils.track(
            ConfigEvents.MissingDefaultConfigMessageConfirm,
            {
              status: ConfirmStatus.accepted,
            }
          );
          const cmd = new DoctorCommand(opts.ext);
          await cmd.execute({
            action: DoctorActionsEnum.ADD_MISSING_DEFAULT_CONFIGS,
            scope: "workspace",
          });
        } else {
          AnalyticsUtils.track(
            ConfigEvents.MissingDefaultConfigMessageConfirm,
            {
              status: ConfirmStatus.rejected,
            }
          );
        }
      });
  }
}
