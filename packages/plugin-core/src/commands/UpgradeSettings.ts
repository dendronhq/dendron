import { createLogger } from "@dendronhq/common-server";
import path from "path";
import { window } from "vscode";
import { Extensions, Settings, SettingsUpgradeOpts, ConfigChanges } from "../settings";
import { DendronWorkspace } from "../workspace";
import { BaseCommand } from "./base";

const L = createLogger("UpgradeSettingsCommand");

type UpgradeSettingsCommandOpts = {
  settingOpts: SettingsUpgradeOpts
};

export class UpgradeSettingsCommand extends BaseCommand<UpgradeSettingsCommandOpts, ConfigChanges> {
  async execute(opts: UpgradeSettingsCommandOpts) {
    const ctx = "execute";
    L.info({ ctx, opts });
    const config = DendronWorkspace.configuration();
    if (!config) {
        throw Error("no ws config found");
    }
    const changed = await Settings.upgrade(
        config,
        Settings.defaultsChangeSet(),
        opts.settingOpts
    );
    this.L.info({ctx, changed})
    Extensions.update(path.dirname(DendronWorkspace.workspaceFile().fsPath));
    return changed;
  }
}
