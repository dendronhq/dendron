import { DVault, FOLDERS, VaultUtils } from "@dendronhq/common-all";
import { WorkspaceService, WorkspaceUtils } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { commands, OpenDialogOptions, Uri, window } from "vscode";
import { PickerUtilsV2 } from "../components/lookup/utils";
import { DENDRON_COMMANDS } from "../constants";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
import { VSCodeUtils } from "../vsCodeUtils";
import { BasicCommand } from "./base";

type CommandOpts = {
  path: string;
  pathRemote?: string;
  name?: string;
  isSelfContained?: boolean;
};

type CommandOutput = { vaults: DVault[] };

export { CommandOpts as VaultAddCommandOpts };

export class CreateNewVaultCommand extends BasicCommand<
  CommandOpts,
  CommandOutput
> {
  key = DENDRON_COMMANDS.CREATE_NEW_VAULT.key;

  constructor(private _ext: IDendronExtension) {
    super();
  }

  async gatherDestinationFolder() {
    const defaultUri = Uri.file(this._ext.getDWorkspace().wsRoot);
    // Prompt user where to create new vault
    const options: OpenDialogOptions = {
      canSelectMany: false,
      openLabel: "Pick or create a folder for your new vault",
      canSelectFiles: false,
      canSelectFolders: true,
      defaultUri,
    };
    const folder = await VSCodeUtils.openFilePicker(options);
    if (_.isUndefined(folder)) {
      return;
    }
    return folder;
  }

  async gatherVaultStandard(): Promise<CommandOpts | undefined> {
    const vaultDestination = await this.gatherDestinationFolder();
    if (!vaultDestination) return;
    const sourceName = await VSCodeUtils.showInputBox({
      prompt: "Name of new vault (optional, press enter to skip)",
      placeHolder: path.basename(vaultDestination),
    });

    return {
      name: sourceName,
      path: vaultDestination,
    };
  }

  async gatherVaultSelfContained(): Promise<CommandOpts | undefined> {
    const vaultName = await VSCodeUtils.showInputBox({
      title: "Vault name",
      prompt: "Name for the new vault",
      placeHolder: "my-vault",
    });
    // If empty, then user cancelled the prompt
    if (PickerUtilsV2.isInputEmpty(vaultName)) return;

    return {
      name: vaultName,
      path: path.join(
        this._ext.getDWorkspace().wsRoot,
        FOLDERS.DEPENDENCIES,
        FOLDERS.LOCAL_DEPENDENCY,
        vaultName
      ),
      isSelfContained: true,
    };
  }

  async gatherInputs(): Promise<CommandOpts | undefined> {
    const config = await this._ext.getDWorkspace().config;
    if (config.dev?.enableSelfContainedVaults) {
      return this.gatherVaultSelfContained();
    } else {
      // A "standard", non self contained vault
      return this.gatherVaultStandard();
    }
  }

  async addVaultToWorkspace(vault: DVault) {
    return WorkspaceUtils.addVaultToWorkspace({
      vault,
      wsRoot: this._ext.getDWorkspace().wsRoot,
    });
  }

  /**
   * Returns all vaults added
   * @param opts
   * @returns
   */
  async execute(opts: CommandOpts) {
    const ctx = "CreateNewVaultCommand";
    let vaults: DVault[] = [];
    Logger.info({ ctx, msg: "enter", opts });
    const wsRoot = this._ext.getDWorkspace().wsRoot;
    const fsPath = VaultUtils.normVaultPath({
      vault: { fsPath: opts.path },
      wsRoot,
    });
    const wsService = new WorkspaceService({ wsRoot });
    const vault: DVault = {
      fsPath,
    };
    // Make sure these don't get set to undefined, or serialization breaks
    if (opts.isSelfContained) {
      vault.selfContained = true;
    }
    if (opts.name) {
      vault.name = opts.name;
    }

    if (VaultUtils.isSelfContained(vault)) {
      await wsService.createSelfContainedVault({
        vault,
        addToConfig: true,
        addToCodeWorkspace: false,
        newVault: true,
      });
    } else {
      await wsService.createVault({ vault });
    }
    await this.addVaultToWorkspace(vault);
    vaults = [vault];

    await commands.executeCommand("workbench.action.reloadWindow");
    window.showInformationMessage("finished creating a new vault");
    return { vaults };
  }
}
