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
import { ProgressLocation, QuickPickItem, window } from "vscode";
import { VSCodeUtils } from "../vsCodeUtils";
import { getExtension } from "../workspace";
import { Logger } from "../logger";
import { ReloadIndexCommand } from "./ReloadIndex";
import { GitUtils } from "@dendronhq/common-server";
import { IDendronExtension } from "../dendronExtensionInterface";

type CommandOpts = {
  type: VaultRemoteSource;
  vault: DVault;
  remoteUrl?: string;
};

type CommandOutput = { updatedVault: DVault | null };

export { CommandOpts as ConvertVaultCommandOpts };

export class ConvertVaultCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CONVERT_VAULT.key;
  constructor(private _ext: IDendronExtension) {
    super();
  }

  async gatherVault(): Promise<DVault | undefined> {
    const vaults = await this._ext.getDWorkspace().vaults;
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

  /** Prompt the user if they agree to have their vault folder moved.
   *
   * @return true if the user agreed to the prompt, false if they cancelled or dismissed it.
   */
  async promptForFolderMove(
    vault: DVault,
    remote: string | null
  ): Promise<boolean> {
    const fromPath = VaultUtils.getRelPath(vault);
    const toPath = GitUtils.getDependencyPathWithRemote({ vault, remote });
    const acceptLabel = "Accept";

    const items: QuickPickItem[] = [
      {
        label: acceptLabel,
        description: `${fromPath} will be moved to ${toPath}`,
      },
      {
        label: "Cancel",
      },
    ];
    const out = await window.showQuickPick(items, {
      canPickMany: false,
      ignoreFocusOut: true,
      title: "The vault folder will be moved",
    });
    if (out?.label === acceptLabel) return true;
    return false;
  }

  async gatherInputs(opts?: CommandOpts): Promise<CommandOpts | undefined> {
    const ctx = "ConvertVaultCommand:gatherInputs";
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

    if (
      (await this._ext.getDWorkspace().config).dev?.enableSelfContainedVaults
    ) {
      // If self contained vaults are enabled, we'll move the vault into the
      // `dependencies` folder. We should ask the user if they are okay with us
      // moving the folder.
      const acceptedMove = await this.promptForFolderMove(
        vault,
        remoteUrl ?? null
      );
      if (!acceptedMove) return;
    }

    return { type, vault, remoteUrl };
  }

  /**
   * Returns all vaults added
   * @param opts
   * @returns
   */
  async execute(opts: CommandOpts) {
    const ctx = "ConvertVaultCommand";
    const { vault, type, remoteUrl } = opts;
    const { wsRoot } = this._ext.getDWorkspace();
    if (!vault || !type)
      throw new DendronError({
        message:
          "Vault or type has not been specified when converting a vault.",
        payload: { vault, type, remoteUrl },
      });
    const workspaceService = getExtension().workspaceService;
    if (!workspaceService)
      throw new DendronError({
        message: "Workspace service is not available when converting a vault.",
        payload: { vault, type, remoteUrl },
      });

    if (type === "local") {
      await window.withProgress(
        {
          location: ProgressLocation.Notification,
          cancellable: false,
          title: "Converting vault to local",
        },
        async (progress) => {
          Logger.info({ ctx, msg: "Converting vault to local", vault, wsRoot });
          await workspaceService.convertVaultLocal({ wsRoot, vault });
          progress.report({ increment: 50 });
          // Reload the index to use the updated config
          await new ReloadIndexCommand().run({ silent: true });
          progress.report({ increment: 50 });
          window.showInformationMessage(
            `Converted vault '${VaultUtils.getName(vault)}' to a ${type} vault.`
          );
          Logger.info({
            ctx,
            msg: "Done converting vault to local",
            vault,
            wsRoot,
          });
        }
      );
      return { updatedVault: vault };
    } else if (type === "remote") {
      if (!remoteUrl)
        throw new DendronError({
          message: "Remote URL for remote vault has not been specified.",
          payload: { vault, type, remoteUrl },
        });
      await window.withProgress(
        {
          location: ProgressLocation.Notification,
          cancellable: false,
          title: "Converting vault to remote",
        },
        async (progress) => {
          Logger.info({
            ctx,
            msg: "Converting vault to remote",
            vault,
            wsRoot,
            remoteUrl,
          });
          const results = await workspaceService.convertVaultRemote({
            wsRoot,
            vault,
            remoteUrl,
          });
          progress.report({ increment: 50 });

          // Reload the index to use the updated config
          await new ReloadIndexCommand().run({ silent: true });
          progress.report({ increment: 50 });
          window.showInformationMessage(
            `Converted vault '${VaultUtils.getName(
              vault
            )}' to a ${type} vault. Remote set to ${results.remote} on branch ${
              results.branch
            }`
          );
          Logger.info({
            ctx,
            msg: "Done converting vault to remote",
            vault,
            wsRoot,
            remoteUrl,
          });
        }
      );

      return { updatedVault: vault };
    } else {
      assertUnreachable(type);
    }
  }
}
