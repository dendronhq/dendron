import {
  assertUnreachable,
  DendronError,
  DVault,
  VaultRemoteSource,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { DENDRON_COMMANDS } from "../constants";
import { BasicCommand } from "./base";
import { window } from "vscode";
import { VSCodeUtils } from "../utils";
import { getDWorkspace, getExtension } from "../workspace";
import { Logger } from "../logger";

type CommandOpts = {
  type: VaultRemoteSource;
  vault: DVault;
  remoteUrl?: string;
};

type CommandOutput = { updatedVault: DVault | null };

export { CommandOpts as VaultConvertCommandOpts };

export class VaultConvertCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.VAULT_CONVERT.key;

  async gatherVault(): Promise<DVault | undefined> {
    const { vaults } = getDWorkspace();
    return (
      await VSCodeUtils.showQuickPick(
        vaults.map((ent) => ({
          label: VaultUtils.getName(ent),
          detail: ent.fsPath,
          data: ent,
        }))
      )
    )?.data;
  }

  async gatherType(vault: DVault): Promise<VaultRemoteSource | undefined> {
    // Guess what we are converting to, based on the vault the user selected.
    let pickedLocal = false;
    let pickedRemote = false;
    if (vault.remote) {
      pickedLocal = true;
    } else {
      pickedRemote = true;
    }
    // We still ask the user in case we guessed wrong, or they are trying to
    // fix an issue with their workspace.
    return (
      await VSCodeUtils.showQuickPick([
        {
          label: "Convert to local",
          detail:
            "The vault will become a local vault, which is a direct part of your workspace.",
          picked: pickedLocal,
          data: "local" as VaultRemoteSource,
        },
        {
          label: "Convert to remote",
          detail:
            "The vault will become a remote vault, which can be shared and maintained separately from your workspace.",
          picked: pickedRemote,
          data: "remote" as VaultRemoteSource,
        },
      ])
    )?.data;
  }

  async gatherRemoteURL(): Promise<string | undefined> {
    // Ask for a remote URL, but it's not strictly required. The user can set up the remote themselves later.
    return VSCodeUtils.showInputBox({
      title: "Remote URL",
      prompt: "Enter the remote URL",
      placeHolder: "git@github.com:dendronhq/dendron-site.git",
    });
  }

  async gatherInputs(opts?: CommandOpts): Promise<CommandOpts | undefined> {
    const ctx = "VaultConvertCommand:gatherInputs";
    let { vault, type, remoteUrl } = opts || {};
    // Let the user select the vault
    if (!vault) vault = await this.gatherVault();
    if (!vault) {
      Logger.info({
        ctx,
        msg: "User cancelled vault convert when picking vault",
      });
      return;
    }

    if (!type) type = await this.gatherType(vault);
    if (!type) {
      Logger.info({
        ctx,
        msg: "User cancelled vault convert when picking vault type",
        vault,
      });
      return;
    }

    // Don't need a remote URL for local vaults
    if (type === "remote" && !remoteUrl) {
      remoteUrl = await this.gatherRemoteURL();
      if (!remoteUrl) {
        Logger.info({
          ctx,
          msg: "User cancelled vault convert when picking remote",
          vault,
          type,
        });
        return;
      }
    }

    return { type, vault, remoteUrl };
  }

  /**
   * Returns all vaults added
   * @param opts
   * @returns
   */
  async execute(opts: CommandOpts) {
    const { vault, type, remoteUrl } = opts;
    const { wsRoot } = getDWorkspace();
    if (!vault || !type || !remoteUrl)
      throw new DendronError({
        message:
          "Vault, type, or remote URL has not been specified when converting a vault.",
        payload: { vault, type, remoteUrl },
      });
    const workspaceService = getExtension().workspaceService;
    if (!workspaceService)
      throw new DendronError({
        message: "Workspace service is not available when converting a vault.",
        payload: { vault, type, remoteUrl },
      });

    if (type === "local") {
      await workspaceService.convertVaultLocal({ wsRoot, vault });
      window.showInformationMessage(
        `Converted vault '${VaultUtils.getName(vault)}' to a ${type} vault.`
      );
      return { updatedVault: vault };
    } else if (type === "remote") {
      const results = await workspaceService.convertVaultRemote({
        wsRoot,
        vault,
        remoteUrl,
      });
      window.showInformationMessage(
        `Converted vault '${VaultUtils.getName(
          vault
        )}' to a ${type} vault. Remote set to ${results.remote} on branch ${
          results.branch
        }`
      );
      return { updatedVault: vault };
    } else {
      assertUnreachable(type);
    }
  }
}
