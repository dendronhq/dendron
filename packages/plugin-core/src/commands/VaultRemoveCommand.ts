import { DVault, VaultUtils } from "@dendronhq/common-all";
import { WorkspaceService } from "@dendronhq/engine-server";
import _ from "lodash";
import { commands, window } from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { Logger } from "../logger";
import { VSCodeUtils } from "../utils";
import { getDWorkspace } from "../workspace";
import { BasicCommand } from "./base";

type CommandOpts = {
  vault: DVault;
  /**
   * added for contextual-ui check
   */
  fsPath?: string;
};

type CommandOutput = { vault: DVault };

export { CommandOpts as VaultRemoveCommandOpts };

export class VaultRemoveCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.VAULT_REMOVE.key;
  async gatherInputs(opts?: CommandOpts): Promise<any> {
    const { vaults } = getDWorkspace();
    const wsRoot = getDWorkspace().wsRoot as string;
    /**
     * check added for contextual-ui. If the args are passed to the gather inputs,
     * there is no need to show quickpick to select a vault
     */
    if (opts && opts.fsPath) {
      const vault = VaultUtils.getVaultByDirPath({
        fsPath: opts.fsPath,
        vaults,
        wsRoot,
      });
      return { vault };
    } else {
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
  }

  async execute(opts: CommandOpts) {
    const ctx = "VaultRemove";
    // NOTE: relative vault
    const { vault } = opts;
    const wsRoot = getDWorkspace().wsRoot as string;
    const wsService = new WorkspaceService({ wsRoot });
    Logger.info({ ctx, msg: "preRemoveVault", vault });
    await wsService.removeVault({ vault, updateWorkspace: true });
    window.showInformationMessage(
      "finished removing vault (from dendron). you will still need to delete the notes from your disk"
    );
    await commands.executeCommand("workbench.action.reloadWindow");
    return { vault };
  }
}
