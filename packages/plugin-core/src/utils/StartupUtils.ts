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
      const resp = ConfigUtils.detectMissingDefaults({ config: rawConfig });
      return resp.data !== undefined && resp.data.needsBackfill;
    } else {
      return false;
    }
  }

  static showMissingDefaultConfigMessage(opts: { ext: IDendronExtension }) {
    AnalyticsUtils.track(ConfigEvents.ShowMissingDefaultConfigMessage);
    const ADD_CONFIG = "Add Missing Configuration";
    vscode.window
      .showInformationMessage(
        "We have detected a missing default configuration. Would you like to add them to dendron.yml?",
        ADD_CONFIG
      )
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
