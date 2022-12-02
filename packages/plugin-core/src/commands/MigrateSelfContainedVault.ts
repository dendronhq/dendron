import { DendronError, DVault, VaultUtils } from "@dendronhq/common-all";
import { WorkspaceService } from "@dendronhq/engine-server";
import _ from "lodash";
import * as vscode from "vscode";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { ExtensionProvider } from "../ExtensionProvider";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = {
  /** Which vault to migrate? */
  vault?: DVault;
};
type CommandOutput = {
  /** The vault after the migration, or null if the migration was cancelled. */
  newVault: DVault | null;
};

export enum MigrateVaultContinueOption {
  continue = "continue",
  cancel = "cancel",
}

export class MigrateSelfContainedVaultCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.MIGRATE_SELF_CONTAINED.key;
  private extension: IDendronExtension;

  async sanityCheck(opts?: CommandOpts): Promise<undefined | string> {
    if (opts?.vault && VaultUtils.isSelfContained(opts.vault)) {
      return "Already a self contained vault";
    }
    return undefined;
  }

  constructor(ext: IDendronExtension) {
    super();
    this.extension = ext;
  }

  async gatherInputs(opts?: CommandOpts): Promise<CommandOpts | undefined> {
    if (opts === undefined) opts = {};
    if (opts.vault === undefined) {
      const nonSCVaults = (await this.extension.getDWorkspace().vaults).filter(
        (vault) => !VaultUtils.isSelfContained(vault) && !vault.seed
      );
      if (nonSCVaults.length === 0) {
        throw new DendronError({
          message:
            "There are no vaults that can be migrated to self contained vaults right now.",
        });
      }
      const vault = await VSCodeUtils.showQuickPick(
        nonSCVaults.map((vault): vscode.QuickPickItem => {
          return {
            label: VaultUtils.getName(vault),
            description: VaultUtils.getRelPath(vault),
          };
        }),
        {
          ignoreFocusOut: true,
          canPickMany: false,
          matchOnDescription: true,
          title: "Select vault to migrate to self contained vault format",
        }
      );
      // Dismissed prompt
      if (!vault) return undefined;
      opts.vault = VaultUtils.getVaultByNameOrThrow({
        vaults: nonSCVaults,
        vname: vault.label,
      });
    }
    const cont = await VSCodeUtils.showQuickPick(
      [
        {
          label: MigrateVaultContinueOption.continue,
          detail: "I have backed up my notes",
        },
        {
          label: MigrateVaultContinueOption.cancel,
        },
      ],
      {
        canPickMany: false,
        title: "Please back up your notes before you continue",
        ignoreFocusOut: true,
      }
    );
    if (cont?.label !== MigrateVaultContinueOption.continue) return undefined;
    return opts;
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const { vault } = opts;
    if (!vault) return { newVault: null };

    const ws = new WorkspaceService({
      wsRoot: ExtensionProvider.getDWorkspace().wsRoot,
    });
    const newVault = await ws.migrateVaultToSelfContained({ vault });
    ws.dispose();
    VSCodeUtils.reloadWindow();
    return { newVault };
  }
}
