import { createLogger } from "@dendronhq/common-server";
import _ from "lodash";
import path from "path";
import { Extension, extensions, window } from "vscode";
import { SettingsUpgradeOpts, WorkspaceConfig } from "../settings";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";

const L = createLogger("UpgradeSettingsCommand");

type UpgradeSettingsCommandOpts = {
  settingOpts: SettingsUpgradeOpts
};

export class UpgradeSettingsCommand extends BaseCommand<UpgradeSettingsCommandOpts, any> {
  async execute(opts: UpgradeSettingsCommandOpts) {
    const ctx = "execute";
    L.info({ ctx, opts });
    const config = DendronWorkspace.configuration();
    if (!config) {
        throw Error("no ws config found");
    }

    const newConfig = WorkspaceConfig.update(path.dirname(DendronWorkspace.workspaceFile().fsPath));
    const badExtensions: Extension<any>[] = newConfig.extensions.unwantedRecommendations?.map(ext => {
      return extensions.getExtension(ext)
    }).filter(Boolean) as Extension<any>[]|| [];
    this.L.info({ctx, badExtensions});
    if (!_.isEmpty(badExtensions)) {
      const msg = [
        "Manual action needed!",
        "The following extensions have been replaced with Dendron specific alternatives. Please uninstall and reload the window:",
      ].concat([badExtensions.map(ext => ext.packageJSON.displayName).join(", ")])
      console.log(msg);
      window.showWarningMessage(msg.join(" "));
    }
  }
}
