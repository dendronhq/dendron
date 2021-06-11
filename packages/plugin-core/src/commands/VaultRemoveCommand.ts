import { DVault, VaultUtils } from "@dendronhq/common-all";
import { assignJSONWithComment } from "@dendronhq/common-server";
import { WorkspaceService } from "@dendronhq/engine-server";
import _ from "lodash";
import { commands, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { DendronWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {
  vault: DVault;
};

type CommandOutput = { vault: DVault };

export { CommandOpts as VaultRemoveCommandOpts };

export class VaultRemoveCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  static key = DENDRON_COMMANDS.VAULT_REMOVE.key;
  async gatherInputs(): Promise<any> {
    const vaults = DendronWorkspace.instance().config.vaults;
    const vaultQuickPick = await VSCodeUtils.showQuickPick(
      vaults.map((ent) => ({
        label: VaultUtils.getName(ent),
        detail: ent.fsPath,
        data: ent,
      }))
    );
    if (_.isUndefined(vaultQuickPick)) {
      return;
    }
    return { vault: vaultQuickPick?.data };
  }

  async execute(opts: CommandOpts) {
    const ctx = "VaultRemove";
    // NOTE: relative vault
    const { vault } = opts;
    const wsRoot = DendronWorkspace.wsRoot() as string;
    const wsService = new WorkspaceService({ wsRoot });
    Logger.info({ ctx, msg: "preRemoveVault", vault });
    await wsService.removeVault({ vault });

    // workspace file
    await DendronWorkspace.updateWorkspaceFile({
      updateCb: (settings) => {
        const folders = _.reject(
          settings.folders,
          (ent) => ent.path === VaultUtils.getRelPath(vault)
        );
        settings = assignJSONWithComment({ folders }, settings);
        return settings;
      },
    });
    window.showInformationMessage(
      "finished removing vault (from dendron). you will still need to delete the notes from your disk"
    );
    await commands.executeCommand("workbench.action.reloadWindow");
    return { vault };
  }
}
