import { createLogger, Logger } from "@dendronhq/common-server";
import path from "path";
import { SettingsUpgradeOpts, WorkspaceConfig } from "../settings";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";
import { extensions } from "vscode";

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
    const badExtensions = newConfig.extensions.unwantedRecommendations?.map(ext => {
      return extensions.getExtension(ext)
    }).filter(Boolean);
    this.L.info({ctx, badExtensions});
    // Extensions.update(path.dirname(DendronWorkspace.workspaceFile().fsPath));
    //return changed;
  }
}
